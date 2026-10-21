from datetime import UTC, datetime

SCHEMA = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Returns the weather now and forecasted",
        "parameters": {"type": "object", "properties": {}},
    },
}


async def handler(**kwargs):
    return datetime.now(UTC).isoformat()
