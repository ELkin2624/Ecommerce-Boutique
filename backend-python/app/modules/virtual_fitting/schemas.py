from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class SizeEstimationRequest(BaseModel):
    product_id: str = Field(..., description="ID del producto para consultar tabla de medidas")
    shoulder_width_cm: float = Field(..., ge=25.0, le=70.0, description="Ancho de hombros en cm")
    chest_circumference_cm: float = Field(
        ..., ge=60.0, le=160.0, description="Contorno de pecho/busto en cm"
    )
    waist_circumference_cm: float = Field(
        ..., ge=50.0, le=150.0, description="Contorno de cintura en cm"
    )
    hip_circumference_cm: Optional[float] = Field(
        None, ge=60.0, le=170.0, description="Contorno de cadera en cm"
    )
    height_cm: Optional[float] = Field(None, ge=120.0, le=220.0, description="Estatura en cm")
    weight_kg: Optional[float] = Field(None, ge=30.0, le=200.0, description="Peso en kg")
    fit_preference: Optional[Literal["slim", "regular", "oversized"]] = "regular"
    fabric_stretch: Optional[Literal["low", "medium", "high"]] = "medium"


class SizeFitDetail(BaseModel):
    part: str
    fit_status: str
    recommended_ease_cm: float


class SizeEstimationResponse(BaseModel):
    status: str = "success"
    recommended_size: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    fit_verdict: str
    details: List[SizeFitDetail]
    alternative_size: Optional[str] = None
    fabric_stretch: str = "medium"


# --- Módulo 3.1: Estrategia Híbrida Inteligente en 3 Pasos (Nike Fit / ASOS / Zalando) ---

class CameraLandmark(BaseModel):
    name: str
    x: float
    y: float
    score: Optional[float] = 1.0


class HybridFittingRequest(BaseModel):
    product_id: str
    height_cm: float = Field(..., ge=120.0, le=220.0, description="Estatura del usuario en cm (Paso 2)")
    weight_kg: Optional[float] = Field(None, ge=30.0, le=200.0, description="Peso en kg opcional")
    fit_preference: Literal["slim", "regular", "oversized"] = "regular"
    device_tilt_deg: Optional[float] = Field(
        90.0, ge=0.0, le=180.0, description="Inclinación del teléfono en grados (80°-100° recomendado para evitar distorsión de perspectiva)"
    )
    # Landmarks de cámara (Paso 1)
    shoulder_span_pixels: Optional[float] = Field(None, description="Distancia en px entre hombros en MoveNet")
    full_body_height_pixels: Optional[float] = Field(None, description="Distancia en px entre cabeza y tobillos")
    landmarks: Optional[List[CameraLandmark]] = None
    fabric_stretch: Optional[Literal["low", "medium", "high"]] = Field("medium", description="Factor de elasticidad de la prenda")
    variants_measurements: Optional[List[dict]] = Field(None, description="Tabla de patronaje real de la prenda")


class HybridFittingResponse(BaseModel):
    status: str = "success"
    recommended_size: str
    confidence_score: float
    fit_verdict: str
    details: List[SizeFitDetail]
    alternative_size: Optional[str] = None
    # Auditoría de perspectiva y escala
    device_tilt_is_optimal: bool = True
    tilt_warning: Optional[str] = None
    calculated_shoulder_cm: float
    calculated_chest_cm: float
    scale_factor_cm_per_pixel: Optional[float] = None
    fabric_stretch_used: str = "medium"


# --- Módulo 3.2: Recorte de Fondo IA con salida WebP transparente ---

class RemoveBackgroundRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    product_id: Optional[str] = None
    model_name: Optional[str] = "u2netp"  # Modelo ligero (~4.7 MB) para ahorrar RAM
    output_format: Optional[Literal["webp", "png"]] = "webp"


class RemoveBackgroundResponse(BaseModel):
    status: str = "success"
    transparent_image_url: str  # DataURL o path WebP con canal alfa
    format: str = "webp"
    model_used: str = "u2netp-lightweight"
    size_reduction_percent: float = 52.0
    message: str = "Fondo eliminado exitosamente mediante IA y codificado en WebP con transparencia alfa."
