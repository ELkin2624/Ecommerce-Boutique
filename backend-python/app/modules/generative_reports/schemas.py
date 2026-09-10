from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MetricType(str, Enum):
    SALES_REVENUE = "sales_revenue"
    TOP_SELLING_PRODUCTS = "top_selling_products"
    INVENTORY_LEVELS = "inventory_levels"
    RESERVATIONS_COUNT = "reservations_count"


class ChartType(str, Enum):
    BAR = "BAR"
    LINE = "LINE"
    PIE = "PIE"
    TABLE = "TABLE"


class ReportDateRange(BaseModel):
    start_date: Optional[str] = Field(None, description="Fecha inicio YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="Fecha fin YYYY-MM-DD")


class ReportFilters(BaseModel):
    branch_name: Optional[str] = Field(None, description="Nombre o filtro de sucursal")
    category: Optional[str] = Field(None, description="Categoría filtrada (ej. vestidos)")
    status: Optional[str] = Field(None, description="Estado de pedido o reserva")


class ReportQueryRequest(BaseModel):
    query_text: str = Field(
        ...,
        description="Pregunta en lenguaje natural generada por texto o transcripción de voz",
        example="¿Cuáles son las 3 prendas más vendidas en la sucursal Centro en el último mes?",
    )
    request_user_id: Optional[str] = None
    user_role: Optional[str] = "ADMIN"


class ParsedReportQuery(BaseModel):
    raw_query: str
    metric: MetricType
    date_range: ReportDateRange
    filters: ReportFilters
    limit: int = Field(default=5, ge=1, le=50)
    suggested_chart: ChartType
    executive_summary: str
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0)
