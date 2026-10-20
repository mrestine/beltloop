from datetime import UTC, datetime

SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_current_time",
        "description": "Returns the current date and time.",
        "parameters": {"type": "object", "properties": {}},
    },
}


async def handler(**kwargs):
    return datetime.now(UTC).isoformat()
