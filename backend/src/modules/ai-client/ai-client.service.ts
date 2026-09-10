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
    return this.post<ParsedReportQueryResponse>('/ai/reports/parse-query', {
      query_text: queryText,
      request_user_id: userId,
      user_role: role || 'ADMIN',
    });
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
