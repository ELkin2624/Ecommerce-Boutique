from fastapi import APIRouter, status
from app.modules.virtual_fitting.schemas import (
    SizeEstimationRequest,
    SizeEstimationResponse,
    HybridFittingRequest,
    HybridFittingResponse,
    RemoveBackgroundRequest,
    RemoveBackgroundResponse,
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


@router.post(
    "/hybrid-estimate",
    response_model=HybridFittingResponse,
    status_code=status.HTTP_200_OK,
    summary="Recomendador Híbrido en 3 Pasos (Nike Fit / ASOS / Zalando)",
    description=(
        "Paso 1: Valida ángulo de cámara (80°-100°) y landmarks. "
        "Paso 2: Micro-calibración de estatura y factor de escala en cm reales. "
        "Paso 3: Cruce cuadrático contra variantes reales y elasticidad de tela (fabricStretch)."
    ),
)
def hybrid_estimate(payload: HybridFittingRequest):
    return VirtualFittingService.estimate_hybrid_size(payload)


@router.post(
    "/remove-background",
    response_model=RemoveBackgroundResponse,
    status_code=status.HTTP_200_OK,
    summary="Eliminar fondo de prenda con IA ligera (salida WebP transparente)",
    description=(
        "Aísla la prenda del fondo utilizando el modelo ultra-ligero u2netp (~4.7 MB) "
        "y genera un archivo WebP con canal alfa optimizado para el Probador Virtual AR."
    ),
)
def remove_background(payload: RemoveBackgroundRequest):
    return VirtualFittingService.remove_background(payload)
