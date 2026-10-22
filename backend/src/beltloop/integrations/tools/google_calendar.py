from datetime import datetime, time, timedelta
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "token_path": {
            "type": "string",
            "description": "Where the Google auth secret and refresh token live",
        },
    },
}

SCHEMA = {
    "type": "function",
    "function": {
        "name": "google_calendar",
        "description": "Returns calendar events for a specified range.",
        "parameters": {
            "type": "object",
            "properties": {
                "range": {
                    "type": "string",
                    "enum": ["today", "tomorrow", "week", "date"],
                    "description": "The time constraints to get calendar events.",
                },
                "date": {
                    "type": "string",
                    "description": "If using the range 'date', specify the date here.",
                },
            },
        },
    },
}

BACKEND_ROOT = Path(__file__).resolve().parents[4]


async def handler(config: dict, db):
    # get the secrets
    token_path = BACKEND_ROOT / config["token_path"]
    # set up the client
    credentials = Credentials.from_authorized_user_file(
        str(token_path), ["https://www.googleapis.com/auth/calendar.readonly"]
    )
    credentials.refresh(Request())
    service = build("calendar", "v3", credentials=credentials)

    # build the request based on the config
    # make the request
    calendar_list = service.calendarList().list().execute()
    calendars = calendar_list.get("items", [])

    today = datetime.now().date()
    range_type = config.get("range")
    if range_type == "tomorrow":
        day = today + timedelta(days=1)
    elif range_type == "date":
        day = datetime.fromisoformat(config["date"]).date()
    else:  # today
        day = today

    time_min = datetime.combine(day, time.min)
    time_max = (
        time_min + timedelta(days=7) if range_type == "week" else time_min + timedelta(days=1)
    )

    all_events = []
    for cal in calendars:
        events_result = (
            service.events()
            .list(
                calendarId=cal["id"],
                singleEvents=True,
                orderBy="startTime",
                timeMin=time_min.isoformat() + "Z",
                timeMax=time_max.isoformat() + "Z",
            )
            .execute()
        )
        for event in events_result.get("items", []):
            all_events.append(
                {
                    "calendar": cal.get("summary"),
                    "summary": event.get("summary"),
                    "start": event.get("start"),
                    "end": event.get("end"),
                }
            )

    return all_events
