from pathlib import Path

CONTEXT_DIR = Path("context")
FILE_NAMES = ("persona.md", "user.md")


def init_context_files():
    CONTEXT_DIR.mkdir(exist_ok=True)
    for name in FILE_NAMES:
        path = CONTEXT_DIR / name
        if not path.exists():
            path.write_text("")


def read_file(filename: str):
    with open(CONTEXT_DIR / filename, "r", encoding="utf-8") as file:
        content = file.read()
        return content


def read_all_files():
    content = {}
    for name in FILE_NAMES:
        with open(CONTEXT_DIR / name, "r", encoding="utf-8") as file:
            content[name] = file.read()
    return content


def write_file(filename: str, content: str):
    with open(CONTEXT_DIR / filename, "w", encoding="utf-8") as file:
        file.write(content)
        return True
