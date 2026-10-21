import asyncio
import json
from typing import TypedDict

from ollama import Client

from .tools import execute_tool

OLLAMA_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b-instruct"
TEMPERATURE = 0
MAX_CONTEXT = 4096
client = Client(host=OLLAMA_HOST, headers={})
chatArgs = {"options": {"temperature": TEMPERATURE, "num_ctx": MAX_CONTEXT}}


class ChatItem(TypedDict):
    content: str
    role: str


async def get_ollama_models():
    return client.list()


async def stream_chat_completion(history: list[ChatItem], model: str, tools, db):
    try:
        response = client.chat(
            **chatArgs,
            stream=True,
            model=model or DEFAULT_MODEL,
            messages=history,
            tools=tools,
        )
        for chunk in response:
            if chunk.message.content:
                yield json.dumps({"data": chunk.message.content}) + "\n"
            if chunk.message.tool_calls:
                # announce to the frontend that tool calls are happening
                yield (
                    json.dumps(
                        {
                            "tool_calls": [
                                {
                                    "name": tc.function.name,
                                    "arguments": tc.function.arguments,
                                }
                                for tc in chunk.message.tool_calls
                            ]
                        }
                    )
                    + "\n"
                )

                # run the tools in parallel, sending results for each as they're ready
                tasks = [
                    asyncio.create_task(run_tool(tool_call=tc, db=db))
                    for tc in chunk.message.tool_calls
                ]
                for task in asyncio.as_completed(tasks):
                    tool_call, result = await task
                    yield (
                        json.dumps(
                            {
                                "tool_result": {
                                    "name": tool_call.function.name,
                                    "arguments": tool_call.function.arguments,
                                    "result": result,
                                }
                            }
                        )
                        + "\n"
                    )
            if chunk.done:
                yield (
                    json.dumps(
                        {
                            "done": True,
                            "prompt_eval_count": chunk.prompt_eval_count,
                            "eval_count": chunk.eval_count,
                            "eval_duration": chunk.eval_duration,
                        }
                    )
                    + "\n"
                )
    except Exception as e:  # noqa: BLE001 — any failure here becomes a client-visible error event
        yield json.dumps({"error": str(e)}) + "\n"


async def run_tool(tool_call, db):
    result = await execute_tool(
        name=tool_call.function.name, arguments=tool_call.function.arguments, db=db
    )
    return tool_call, result


def chat_sync(history: list[ChatItem], model: str, tools: dict | None = None):
    return client.chat(
        **chatArgs, stream=False, model=model or DEFAULT_MODEL, messages=history, tools=tools
    )
