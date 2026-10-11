import json
from typing import TypedDict

from ollama import Client

OLLAMA_HOST = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b-instruct"
client = Client(host=OLLAMA_HOST, headers={})
chatArgs = {"options": {"temperature": 0, "num_ctx": 4096}, "stream": True}


class ChatItem(TypedDict):
    content: str
    role: str


async def get_ollama_models():
    return client.list()


def stream_chat_completion(history: list[ChatItem], model: str):
    try:
        response = client.chat(
            **chatArgs,
            model=model or DEFAULT_MODEL,
            messages=history,
        )
        for chunk in response:
            if chunk.message.content:
                yield json.dumps({"data": chunk.message.content}) + "\n"
            if chunk.done:
                yield (
                    json.dumps(
                        {
                            "done": True,
                            "eval_count": chunk.eval_count,
                            "eval_duration": chunk.eval_duration,
                        }
                    )
                    + "\n"
                )
    except Exception as e:  # noqa: BLE001 — any failure here becomes a client-visible error event
        yield json.dumps({"error": str(e)}) + "\n"
