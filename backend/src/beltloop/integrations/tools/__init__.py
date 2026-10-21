from . import get_current_time

TOOLS = {
    "get_current_time": get_current_time,
}


def get_tool_schemas():
    return [tool.SCHEMA for tool in TOOLS.values()]


def get_tool_schema(name):
    return TOOLS.get(name).SCHEMA or None


def get_tool_config_schema(name: str):
    return TOOLS.get(name).CONFIG_SCHEMA or None


async def execute_tool(name: str, arguments: dict):
    tool = TOOLS.get(name)
    if tool is None:
        raise ValueError(f"Unknown tool: {name}")
    return await tool.handler(**arguments)
