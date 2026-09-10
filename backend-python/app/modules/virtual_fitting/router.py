from fastapi import APIRouter, status
from app.modules.virtual_fitting.schemas import (
    SizeEstimationRequest,
    SizeEstimationResponse,
)
from app.modules.virtual_fitting.service import VirtualFittingService

router = APIRouter()


@router.post(
    "/estimate-size",
    response_model=SizeEstimationResponse,
    status_code=status.HTTP_200_OK,
    summary="Calcular estimación de talla y ajuste anatómico",
    description=(
        "Compara las medidas corporales del usuario contra la tabla de patronaje de la prenda "
        "y sugiere la talla óptima minimizando la probabilidad de devolución."
    ),
)
def estimate_size(payload: SizeEstimationRequest):
    return VirtualFittingService.estimate_size(payload)
