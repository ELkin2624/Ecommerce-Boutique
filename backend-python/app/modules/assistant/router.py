from fastapi import APIRouter, status
from app.modules.assistant.schemas import ChatRequest, ChatResponse
from app.modules.assistant.service import AssistantService

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversar con el Asistente Virtual de FashionStore",
    description="Responde preguntas de compras, políticas de reserva, disponibilidad en sucursales y sugerencias de estilo.",
)
async def chat_with_assistant(payload: ChatRequest):
    return await AssistantService.chat(payload)
