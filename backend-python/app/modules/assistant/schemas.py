from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Rol del emisor ('user' o 'assistant')")
    content: str = Field(..., description="Contenido del mensaje")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, description="Historial de la conversación")
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    status: str = "success"
    reply: str
    intent: str
    suggested_actions: List[str] = Field(default_factory=list)
