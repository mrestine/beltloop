from datetime import UTC, datetime
from zoneinfo import available_timezones

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "timezone": {
            "type": "string",
            "enum": sorted(available_timezones()),
            "default": "UTC",
        }
    },
}

SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_current_time",
        "description": "Returns the current date and time for the configured timezone.",
        "parameters": {"type": "object", "properties": {}},
    },
}


async def handler(**kwargs):
    return datetime.now(UTC).isoformat()
