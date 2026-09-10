import httpx
from app.core.config import settings
from app.modules.assistant.schemas import ChatRequest, ChatResponse


class AssistantService:
    @staticmethod
    async def chat(req: ChatRequest) -> ChatResponse:
        if settings.AI_SERVICE_API_KEY and not settings.MOCK_MODE:
            try:
                return await AssistantService._chat_with_llm(req)
            except Exception as e:
                print(f"⚠️ Fallo llamada a Chat LLM ({e}), recurriendo a asistente heurístico...")

        return AssistantService._chat_with_heuristics(req)

    @staticmethod
    async def _chat_with_llm(req: ChatRequest) -> ChatResponse:
        system_prompt = (
            "Eres el Asistente Virtual Oficial de FashionStore, boutique de moda inteligente. "
            "Eres cordial, elegante y experto en recomendaciones de prendas, disponibilidad por sucursales "
            "y políticas de reserva para el probador físico (las reservas duran 48 horas sin costo). "
            "Responde de forma concisa y amigable en español."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for m in req.messages:
            messages.append({"role": m.role, "content": m.content})

        headers = {
            "Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.AI_MODEL_NAME,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 250,
        }

        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["choices"][0]["message"]["content"].strip()

            return ChatResponse(
                status="success",
                reply=reply_text,
                intent="general_assistance",
                suggested_actions=["Ver catálogo de vestidos", "Consultar mis reservas", "Ubicación de sucursales"],
            )

    @staticmethod
    def _chat_with_heuristics(req: ChatRequest) -> ChatResponse:
        last_msg = req.messages[-1].content.lower()

        if any(w in last_msg for w in ["reserva", "apartar", "probador", "tiempo", "cuanto dura"]):
            reply = (
                "¡Con gusto! En FashionStore puedes reservar prendas desde la app o la web para probártelas en "
                "la sucursal de tu elección. Las reservas se guardan durante 48 horas y son 100% gratuitas. "
                "Si no asistes, las prendas vuelven automáticamente al inventario general."
            )
            intent = "faq_reservations"
            actions = ["Hacer una reserva", "Ver mis reservas activas"]
        elif any(w in last_msg for w in ["sucursal", "horario", "direccion", "donde estan", "tienda"]):
            reply = (
                "Contamos con 2 sucursales activas:\n"
                "• Sucursal Central La Paz: Av. 16 de Julio #1440 (El Prado). Lunes a Sábado de 09:00 a 20:00.\n"
                "• Sucursal Equipetrol Santa Cruz: Av. San Martín esq. Calle 5 Este. Lunes a Domingo de 10:00 a 21:00."
            )
            intent = "faq_branches"
            actions = ["Ver disponibilidad en Sucursal Central", "Ver disponibilidad en Equipetrol"]
        elif any(w in last_msg for w in ["vestido", "evento", "fiesta", "gala"]):
            reply = (
                "Para eventos de gala te recomendamos nuestro icónico 'Vestido Gala Elegance' en color Rojo Carmesí o Negro, "
                "disponible en tallas S y M. ¡Puedes usar nuestro probador virtual para verificar tu talla antes de reservar!"
            )
            intent = "product_recommendation"
            actions = ["Ver Vestido Gala Elegance", "Probar en Vestidor Virtual"]
        else:
            reply = (
                "¡Hola! Soy tu asistente de moda en FashionStore. ¿En qué puedo colaborarte hoy? "
                "Puedo ayudarte a buscar prendas, consultar disponibilidad por sucursal o explicarte cómo reservar para el probador físico."
            )
            intent = "greeting"
            actions = ["Explorar colección Verano 2026", "Cómo funciona el probador virtual", "Ver sucursales"]

        return ChatResponse(
            status="success",
            reply=reply,
            intent=intent,
            suggested_actions=actions,
        )
