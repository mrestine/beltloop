from sqlmodel import select

from ...models import ToolConfig
from . import get_current_time, get_weather, google_calendar, memory

TOOLS = {
    "get_current_time": get_current_time,
    "get_weather": get_weather,
    "google_calendar": google_calendar,
    "memory": memory,
}


def get_tool_schemas():
    return [tool.SCHEMA for tool in TOOLS.values()]


def get_tool_schema(name):
    return TOOLS.get(name).SCHEMA or None


def get_tool_config_schema(name: str):
    return TOOLS.get(name).CONFIG_SCHEMA or None


async def execute_tool(name: str, arguments: dict, db):
    tool = TOOLS.get(name)
    configStatement = select(ToolConfig).where(ToolConfig.name == name)
    tool_config = (await db.exec(configStatement)).one_or_none()
    config = tool_config.config if tool_config else {}
    if tool is None:
        raise ValueError(f"Unknown tool: {name}")
    return await tool.handler(config={**config, **arguments}, db=db)
