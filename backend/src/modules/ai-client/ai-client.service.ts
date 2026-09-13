import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ParsedReportQueryResponse {
  raw_query: string;
  metric: 'sales_revenue' | 'top_selling_products' | 'inventory_levels' | 'reservations_count';
  date_range: {
    start_date?: string;
    end_date?: string;
  };
  filters: {
    branch_name?: string;
    category?: string;
    status?: string;
  };
  limit: number;
  suggested_chart: 'BAR' | 'LINE' | 'PIE' | 'TABLE';
  executive_summary: string;
  confidence_score: number;
}

export interface RecommendationResponse {
  status: string;
  recommendations: Array<{
    product_id: string;
    name?: string;
    score: number;
    reason: string;
  }>;
  total: number;
  engine_version: string;
}

export interface SizeEstimationResponse {
  status: string;
  recommended_size: string;
  confidence_score: number;
  fit_verdict: string;
  details: Array<{
    part: string;
    fit_status: string;
    recommended_ease_cm: number;
  }>;
  alternative_size?: string;
}

export interface ChatResponse {
  status: string;
  reply: string;
  intent: string;
  suggested_actions: string[];
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://127.0.0.1:8000');
  }

  async parseReportQuery(queryText: string, userId?: string, role?: string): Promise<ParsedReportQueryResponse> {
    try {
      return await this.post<ParsedReportQueryResponse>('/ai/reports/parse-query', {
        query_text: queryText,
        request_user_id: userId,
        user_role: role || 'ADMIN',
      });
    } catch (err: any) {
      this.logger.warn(`FastAPI no disponible para parseReportQuery (${err.message}). Utilizando parser heurístico de contingencia.`);
      return this.parseLocalHeuristic(queryText);
    }
  }

  private parseLocalHeuristic(query: string): ParsedReportQueryResponse {
    const text = query.toLowerCase();

    // 1. Detección de métrica y gráfico sugerido
    let metric: ParsedReportQueryResponse['metric'] = 'top_selling_products';
    let suggested_chart: ParsedReportQueryResponse['suggested_chart'] = 'BAR';
    let summary = 'Análisis de productos con mayor rotación en el catálogo.';

    if (text.includes('venta') || text.includes('ingreso') || text.includes('recaud') || text.includes('ganancia') || text.includes('dinero')) {
      metric = 'sales_revenue';
      suggested_chart = 'LINE';
      summary = 'Ingresos por ventas y distribución de ingresos según sucursal y canal.';
    } else if (text.includes('inventario') || text.includes('stock') || text.includes('almacen') || text.includes('existencia') || text.includes('agotad')) {
      metric = 'inventory_levels';
      suggested_chart = 'BAR';
      summary = 'Niveles actuales de existencias y disponibilidad en piso de ventas y almacenes.';
    } else if (text.includes('reserva') || text.includes('probador') || text.includes('cita') || text.includes('separad')) {
      metric = 'reservations_count';
      suggested_chart = 'PIE';
      summary = 'Métricas de prendas reservadas para probador y tasa de asistencia de clientes.';
    } else if (text.includes('top') || text.includes('mas vendid') || text.includes('vendidos') || text.includes('producto') || text.includes('prenda')) {
      metric = 'top_selling_products';
      suggested_chart = 'BAR';
      summary = 'Prendas con mayor demanda y rotación de stock.';
    }

    // 2. Detección de Sucursal
    let branchName: string | undefined;
    if (text.includes('la paz') || text.includes('prado') || text.includes('central')) {
      branchName = 'La Paz';
    } else if (text.includes('santa cruz') || text.includes('equipetrol')) {
      branchName = 'Santa Cruz';
    }

    // 3. Detección de Categoría
    let category: string | undefined;
    const catKeywords = ['vestido', 'camisa', 'pantalon', 'polo', 'abrigo', 'chaqueta', 'falda', 'blusa'];
    for (const kw of catKeywords) {
      if (text.includes(kw)) {
        category = kw;
        break;
      }
    }

    // 4. Fechas por defecto (Últimos 30 días)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      raw_query: query,
      metric,
      date_range: {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      },
      filters: {
        branch_name: branchName,
        category,
      },
      limit: 8,
      suggested_chart,
      executive_summary: summary,
      confidence_score: 0.95,
    };
  }

  async getRecommendations(payload: any): Promise<RecommendationResponse> {
    return this.post<RecommendationResponse>('/ai/recommendations', payload);
  }

  async estimateSize(payload: any): Promise<SizeEstimationResponse> {
    return this.post<SizeEstimationResponse>('/ai/fitting/estimate-size', payload);
  }

  async chat(messages: Array<{ role: string; content: string }>, userId?: string): Promise<ChatResponse> {
    return this.post<ChatResponse>('/ai/assistant/chat', {
      messages,
      user_id: userId,
    });
  }

  private async post<T>(endpoint: string, body: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Error de FastAPI en ${endpoint}: ${response.status} - ${errorText}`);
        throw new BadGatewayException(`Fallo en el microservicio de IA: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      this.logger.error(`Error comunicando con microservicio de IA en ${url}: ${error.message}`);
      throw new BadGatewayException(`No se pudo conectar al microservicio de IA: ${error.message}`);
    }
  }
}
