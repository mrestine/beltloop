from sqlmodel import select

from ...models import Memory

CONFIG_SCHEMA = {
    "type": "object",
    "properties": {},
}

SCHEMA = {
    "type": "function",
    "function": {
        "name": "memory",
        "description": "Allows remembering, recalling, or forgetting memories",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "required": True,
                    "enum": ["remember", "recall", "forget"],
                    "description": "An action to set (remember), get (recall), or delete (forget) content at a memory key.",
                },
                "key": {
                    "type": "string",
                    "required": True,
                    "description": "A unique key that should describe the content as briefly as possible without colliding with other keys.",
                },
                "content": {
                    "type": "string",
                    "description": "The content of the memory. Use this only with 'remember' to set the value in memory.",
                },
            },
        },
    },
}


async def handler(config: dict, db):
    action = config.get("action")
    key = config.get("key")

    statement = select(Memory).where(Memory.key == key)
    existing_memory = (await db.exec(statement)).one_or_none()

    if action == "remember":
        if existing_memory is not None:
            existing_memory.content = config.get("content")
            await db.commit()
            await db.refresh(existing_memory)
            return f"Remembered {key}"
        else:
            memory = Memory(key=key, content=config.get("content"))
            db.add(memory)
            await db.commit()
            await db.refresh(memory)
            return f"Remembered {key}"
    elif action == "recall":
        return existing_memory.content if existing_memory is not None else "No memory found."
    elif action == "forget":
        if existing_memory is not None:
            await db.delete(existing_memory)
            await db.commit()
            return "Removed."
        else:
            return f"No memory found for key: {key}."
    else:
        return f"invalid action: {action}. Use 'remember', 'recall', or 'forget'."
