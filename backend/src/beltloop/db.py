from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

engine = create_async_engine("sqlite+aiosqlite:///beltloop.db")


async def get_session():
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
