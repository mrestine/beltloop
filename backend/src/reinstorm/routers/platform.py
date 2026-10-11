from fastapi import APIRouter
from ..integrations.ollama import get_ollama_models

router = APIRouter(prefix="/platform")

@router.get('/models')
async def get_models():
    return await get_ollama_models()
