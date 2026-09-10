from fastapi import APIRouter, status
from app.modules.recommendations.schemas import (
    RecommendationRequest,
    RecommendationResponse,
)
from app.modules.recommendations.service import RecommendationService

router = APIRouter()


@router.post(
    "/recommendations",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generar recomendaciones hiperpersonalizadas",
    description=(
        "Evalúa prendas candidatas contra el perfil del usuario (talla, categorías previas) "
        "y garantiza disponibilidad física de stock en la sucursal seleccionada."
    ),
)
def get_recommendations(payload: RecommendationRequest):
    return RecommendationService.generate_recommendations(payload)
