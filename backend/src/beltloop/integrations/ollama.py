from typing import TypedDict

from ollama import Client

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


async def get_ollama_response(history: list[ChatItem], model: str, stream: bool, tools):
    try:
        response = client.chat(
            **chatArgs,
            stream=stream,
            model=model or DEFAULT_MODEL,
            messages=history,
            tools=tools,
        )
        chunks = response if stream else [response]
        for chunk in chunks:
            if chunk.message.content:
                yield {"data": chunk.message.content}
            if chunk.message.tool_calls:
                # announce to the frontend that tool calls are happening
                yield {
                    "tool_calls": [
                        {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                        for tc in chunk.message.tool_calls
                    ]
                }
            if chunk.done:
                yield {
                    "done": True,
                    "prompt_eval_count": chunk.prompt_eval_count,
                    "eval_count": chunk.eval_count,
                    "eval_duration": chunk.eval_duration,
                }
    except Exception as e:  # noqa: BLE001 — any failure here becomes a client-visible error event
        yield {"error": str(e)}
