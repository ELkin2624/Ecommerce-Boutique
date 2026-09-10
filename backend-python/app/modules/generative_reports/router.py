from fastapi import APIRouter, status
from app.modules.generative_reports.schemas import (
    ReportQueryRequest,
    ParsedReportQuery,
)
from app.modules.generative_reports.service import GenerativeReportsService

router = APIRouter()


@router.post(
    "/parse-query",
    response_model=ParsedReportQuery,
    status_code=status.HTTP_200_OK,
    summary="Interpretar consulta analítica en lenguaje natural (Texto o Voz)",
    description=(
        "Recibe la pregunta en lenguaje natural, extrae entidades y métricas, "
        "y genera un JSON estructurado seguro para que NestJS construya la consulta sin riesgo de SQL Injection."
    ),
)
async def parse_report_query(payload: ReportQueryRequest):
    return await GenerativeReportsService.parse_report_query(payload)
