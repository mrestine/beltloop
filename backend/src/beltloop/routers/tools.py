from fastapi import APIRouter

from ..integrations.ollama import test_tool_call
from ..integrations.tools import execute_tool, get_tool_schemas

router = APIRouter(prefix="/tools")


@router.get("/list")
def get_tools_list():
    return get_tool_schemas()


@router.get("/test")
async def tools_test():
    response = await test_tool_call([])
    if response.message.tool_calls:
        tool_call = response.message.tool_calls[0].function
        tool_result = await execute_tool(name=tool_call.name, arguments=tool_call.arguments)
        tool_message = {
            "role": "tool",
            "content": str(tool_result),
            "name": tool_call.name,
        }
        response2 = await test_tool_call([response.message, tool_message])
        return response2
    else:
        return response
