from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.context import read_all_files, read_file, write_file

router = APIRouter(prefix="/context")


class ContextFileUpdate(BaseModel):
    content: str


ContextFilename = Literal["persona.md", "user.md"]


@router.get("/all")
async def get_context_files():
    return read_all_files()


@router.get("/{filename}")
async def get_context_file(filename: ContextFilename):
    return read_file(filename)


@router.put("/{filename}")
async def write_context_file(filename: ContextFilename, payload: ContextFileUpdate):
    return write_file(filename, payload.content)
