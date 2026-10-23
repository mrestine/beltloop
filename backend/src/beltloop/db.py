from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

engine = create_async_engine("sqlite+aiosqlite:///beltloop.db")


@event.listens_for(engine.sync_engine, "connect")
def _enable_fk(dbapi_connection, _):
    dbapi_connection.execute("PRAGMA foreign_keys=ON")


async def get_session():
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
