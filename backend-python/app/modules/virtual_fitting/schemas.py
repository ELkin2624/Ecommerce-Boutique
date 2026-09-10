from typing import List, Optional
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
