from typing import List, Optional
from pydantic import BaseModel, Field


class CandidateProduct(BaseModel):
    product_id: str = Field(..., description="ID único del producto")
    name: str = Field(..., description="Nombre comercial de la prenda")
    category: str = Field(..., description="Categoría (vestidos, camisas, pantalones, etc.)")
    available_sizes_in_branch: List[str] = Field(
        default_factory=list,
        description="Tallas con stock disponible en la sucursal activa",
    )
    popularity_score: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Puntuación histórica de popularidad o ventas",
    )


class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="Identificador del usuario")
    preferred_sizes: List[str] = Field(
        default_factory=list,
        description="Tallas preferidas o habituales del cliente (ej. ['M', '38'])",
    )
    history_categories: List[str] = Field(
        default_factory=list,
        description="Categorías previamente compradas o reservadas",
    )
    target_branch_id: str = Field(
        ...,
        description="Sucursal física seleccionada para validar disponibilidad inmediata",
    )
    candidate_products: List[CandidateProduct] = Field(
        default_factory=list,
        description="Listado de prendas candidatas con stock en la sucursal",
    )
    limit: int = Field(default=5, ge=1, le=20, description="Cantidad máxima de recomendaciones")


class RecommendedItem(BaseModel):
    product_id: str
    name: Optional[str] = None
    score: float = Field(..., ge=0.0, le=1.0)
    reason: str


class RecommendationResponse(BaseModel):
    status: str = "success"
    recommendations: List[RecommendedItem]
    total: int
    engine_version: str = "hybrid-v1.0"
