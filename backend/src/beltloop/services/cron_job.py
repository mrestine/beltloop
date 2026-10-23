import json
from datetime import UTC, datetime

from ..integrations.ollama import DEFAULT_MODEL
from ..models import CronJob, CronJobRun, Message, Session
from ..models.cron_job import Status
from ..routers.messages import MessageCreate
from .chat import handle_chat_turn

DEFAULT_TIMEOUT = 120


async def run_cron_job(id: int, db):
    job = await db.get(CronJob, id)
    if job is None or job.enabled == False:
        return

    # create the run in the db
    now = datetime.now(UTC)
    run = CronJobRun(cron_job_id=id, started_at=now, status=Status.running)
    db.add(run)
    await db.commit()
    await db.refresh(run)

    # find the session, fall back to new session
    session = None
    model = DEFAULT_MODEL if job.model is None else job.model
    if job.target_session_id is not None:
        session = await db.get(Session, job.target_session_id)
    if session is None:
        session = Session(title=f"{job.name}-{now.isoformat()}", model=model)
        db.add(session)
        await db.commit()
        await db.refresh(session)

    # the message payload for the session from prompt including context and memory
    payload = MessageCreate(
        session_id=session.id,
        content=job.prompt,
        model=model,
    )
    response = None
    try:
        # TODO: enforce timeout
        response = None
        async for line in handle_chat_turn(db, payload, session, stream_response=False):
            message = json.loads(line)
            if message.get("done"):
                assistant_message_id = message.get("assistant_message_id")
                if assistant_message_id:
                    response = (await db.get(Message, assistant_message_id)).content
                    run.status = Status.complete
                else:
                    response = "No assistant message returned"
                    run.status = Status.error
                run.output = response
    except Exception as e:  # noqa: BLE001 — any failure here becomes a client-visible error event
        run.status = Status.error
        run.output = f"An error occurred while running the job: {e}.\n\nResponse: {response}"
    now = datetime.now(UTC)
    run.finished_at = now
    await db.commit()

    # TODO: some sort of delivery or alert that the job is done?
    return run
