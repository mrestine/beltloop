from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from ..db import AsyncSession, get_session
from ..models import CronJob, CronJobRun
from ..services.cron_job import run_cron_job

router = APIRouter(prefix="/jobs")


class CronJobCreate(BaseModel):
    name: str
    cron: str
    prompt: str
    model: str | None
    target_session_id: int | None
    timeout: int | None


@router.get("/")
async def get_cron_jobs(db: AsyncSession = Depends(get_session)):
    statement = select(CronJob).order_by(CronJob.created_at)
    jobs = (await db.exec(statement)).all()
    return jobs


@router.get("/{id}/runs")
async def get_runs_for_job(id: int, db: AsyncSession = Depends(get_session)):
    job = await db.get(CronJob, id)
    if job is None:
        raise HTTPException(status_code=404, detail="cron job not found")

    statement = (
        select(CronJobRun).where(CronJobRun.cron_job_id == id).order_by(CronJobRun.started_at)
    )
    runs = (await db.exec(statement)).all()
    return {"job": job, "runs": runs}


@router.get("/{id}/run")
async def run_job_now(id: int, db: AsyncSession = Depends(get_session)):
    job = await db.get(CronJob, id)
    if job is None:
        raise HTTPException(status_code=404, detail="cron job not found")

    return await run_cron_job(id, db)


@router.post("/")
async def create_cron_job(payload: CronJobCreate, db: AsyncSession = Depends(get_session)):
    job = CronJob(**payload.model_dump())
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


@router.put("/{id}")
async def update_cron_job(id: int, payload: CronJobCreate, db: AsyncSession = Depends(get_session)):
    job = await db.get(CronJob, id)
    if job is None:
        raise HTTPException(status_code=404, detail="cron job not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, key, value)

    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{id}", status_code=204)
async def delete_job(id: int, db: AsyncSession = Depends(get_session)):
    job = await db.get(CronJob, id)
    if job is None:
        raise HTTPException(status_code=404, detail="cron job not found")
    await db.delete(job)
    await db.commit()
