from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import context, messages, platform, sessions, tools
from .services.context import init_context_files


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    init_context_files()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(context.router)
app.include_router(messages.router)
app.include_router(platform.router)
app.include_router(sessions.router)
app.include_router(tools.router)
