from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import select

from ..db import AsyncSession, get_session
from ..integrations.tools import get_tool_config_schema, get_tool_schema, get_tool_schemas
from ..models import ToolConfig

router = APIRouter(prefix="/tools")


class ToolConfigUpsert(BaseModel):
    enabled: bool
    config: dict


@router.get("/list")
def get_tools_list():
    return get_tool_schemas()


@router.get("/{name}")
async def get_tool_details(name: str, db: AsyncSession = Depends(get_session)):
    schema = get_tool_schema(name)
    config_schema = get_tool_config_schema(name)
    statement = select(ToolConfig).where(ToolConfig.name == name)
    tool_config = (await db.exec(statement)).one_or_none()
    return {
        "schema": schema,
        "config": config_schema,
        "values": tool_config,
    }


@router.put("/{name}")
async def set_tool_config(
    name: str, payload: ToolConfigUpsert, db: AsyncSession = Depends(get_session)
):
    statement = select(ToolConfig).where(ToolConfig.name == name)
    config = (await db.exec(statement)).one_or_none()
    # TODO: validate against tool schema for name

    if config is None:
        config = ToolConfig(
            name=name,
            enabled=True if payload.enabled is None else payload.enabled,
            config=payload.config,
        )
        db.add(config)
        await db.commit()
    else:
        config.enabled = payload.enabled
        config.config = {**config.config, **payload.config}
        await db.commit()
        await db.refresh(config)
    return config
