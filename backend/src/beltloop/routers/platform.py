from fastapi import APIRouter

from ..integrations.ollama import MAX_CONTEXT, TEMPERATURE, get_ollama_models

router = APIRouter(prefix="/platform")


@router.get("/properties")
async def get_properties():
    model_list = await get_ollama_models()
    return {
        "models": model_list.models,
        "max_context": MAX_CONTEXT,
        "temperature": TEMPERATURE,
    }
