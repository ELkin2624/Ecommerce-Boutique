import re
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.modules.generative_reports.schemas import (
    ReportQueryRequest,
    ParsedReportQuery,
    MetricType,
    ChartType,
    ReportDateRange,
    ReportFilters,
)


class GenerativeReportsService:
    @staticmethod
    async def parse_report_query(req: ReportQueryRequest) -> ParsedReportQuery:
        # 1. Si hay API Key de OpenAI configurada y no estamos forzando mock puro, intentar llamada LLM
        if settings.AI_SERVICE_API_KEY and not settings.MOCK_MODE:
            try:
                return await GenerativeReportsService._parse_with_llm(req)
            except Exception as e:
                print(f"⚠️ Fallo llamada a LLM externo ({e}), ejecutando Fallback Heurístico Local...")

        # 2. Fallback Heurístico Local Determinista (Ideal para demo y parcial sin internet)
        return GenerativeReportsService._parse_with_heuristics(req)

    @staticmethod
    async def _parse_with_llm(req: ReportQueryRequest) -> ParsedReportQuery:
        system_prompt = (
            "Eres el Analista de Inteligencia de Negocios de FashionStore. "
            "Tu tarea es analizar la consulta del usuario en lenguaje natural y retornar un JSON con: "
            "metric (sales_revenue, top_selling_products, inventory_levels, reservations_count), "
            "date_range {start_date, end_date}, filters {branch_name, category, status}, "
            "limit, suggested_chart (BAR, LINE, PIE, TABLE), y executive_summary en español. "
            "NUNCA generes sentencias SQL. Solo parámetros estructurados."
        )

        headers = {
            "Authorization": f"Bearer {settings.AI_SERVICE_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": settings.AI_MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.query_text},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            import json

            parsed = json.loads(content)
            return ParsedReportQuery(
                raw_query=req.query_text,
                metric=MetricType(parsed.get("metric", "top_selling_products")),
                date_range=ReportDateRange(
                    start_date=parsed.get("date_range", {}).get("start_date"),
                    end_date=parsed.get("date_range", {}).get("end_date"),
                ),
                filters=ReportFilters(
                    branch_name=parsed.get("filters", {}).get("branch_name"),
                    category=parsed.get("filters", {}).get("category"),
                    status=parsed.get("filters", {}).get("status"),
                ),
                limit=parsed.get("limit", 5),
                suggested_chart=ChartType(parsed.get("suggested_chart", "BAR")),
                executive_summary=parsed.get(
                    "executive_summary",
                    "Consulta interpretada correctamente por el motor generativo.",
                ),
                confidence_score=0.98,
            )

    @staticmethod
    def _parse_with_heuristics(req: ReportQueryRequest) -> ParsedReportQuery:
        text = req.query_text.lower()

        # Determinar Métrica y Gráfico
        if any(w in text for w in ["ingreso", "factur", "ganancia", "dinero", "total ventas", "monto"]):
            metric = MetricType.SALES_REVENUE
            chart = ChartType.LINE
        elif any(w in text for w in ["stock", "inventario", "almacen", "quedan", "disponib"]):
            metric = MetricType.INVENTORY_LEVELS
            chart = ChartType.PIE
        elif any(w in text for w in ["reserva", "apartad", "probador"]):
            metric = MetricType.RESERVATIONS_COUNT
            chart = ChartType.BAR
        else:
            # Por defecto: prendas más vendidas / populares
            metric = MetricType.TOP_SELLING_PRODUCTS
            chart = ChartType.BAR

        # Extraer Filtro de Sucursal
        branch = None
        if "centro" in text or "prado" in text or "la paz" in text:
            branch = "Sucursal Central La Paz"
        elif "norte" in text or "equipetrol" in text or "santa cruz" in text:
            branch = "Sucursal Equipetrol Santa Cruz"

        # Extraer Filtro de Categoría
        category = None
        if "vestido" in text:
            category = "vestidos"
        elif "camisa" in text:
            category = "camisas"
        elif "pantalon" in text:
            category = "pantalones"

        # Extraer Fechas
        today = datetime.now()
        start_date = None
        end_date = today.strftime("%Y-%m-%d")

        if "mes pasado" in text or "agosto" in text:
            start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
        elif "semana" in text:
            start_date = (today - timedelta(days=7)).strftime("%Y-%m-%d")
        elif "hoy" in text:
            start_date = today.strftime("%Y-%m-%d")
        else:
            start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")

        # Extraer Límite (ej: "las 3 prendas", "top 5")
        limit = 5
        match_limit = re.search(r"\b(\d+)\b", text)
        if match_limit:
            parsed_num = int(match_limit.group(1))
            if 1 <= parsed_num <= 50:
                limit = parsed_num

        # Generar Resumen Ejecutivo Contextual
        filtros_desc = []
        if branch:
            filtros_desc.append(f"en {branch}")
        if category:
            filtros_desc.append(f"para la categoría '{category}'")

        filtros_str = " " + " y ".join(filtros_desc) if filtros_desc else ""

        if metric == MetricType.TOP_SELLING_PRODUCTS:
            summary = f"Análisis de los {limit} artículos con mayor demanda{filtros_str} en el período analizado."
        elif metric == MetricType.SALES_REVENUE:
            summary = f"Evolución de ingresos y facturación consolidada{filtros_str}."
        elif metric == MetricType.INVENTORY_LEVELS:
            summary = f"Distribución de niveles de stock y disponibilidad actual{filtros_str}."
        else:
            summary = f"Métricas de reservas en probador físico y tasa de conversión{filtros_str}."

        return ParsedReportQuery(
            raw_query=req.query_text,
            metric=metric,
            date_range=ReportDateRange(start_date=start_date, end_date=end_date),
            filters=ReportFilters(branch_name=branch, category=category),
            limit=limit,
            suggested_chart=chart,
            executive_summary=summary,
            confidence_score=0.96,
        )
