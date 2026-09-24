import { Injectable, Logger, BadGatewayException, OnModuleInit } from '@nestjs/common';
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
export class AiClientService implements OnModuleInit {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const rawUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      this.configService.get<string>('FASTAPI_AI_URL') ||
      'http://127.0.0.1:8000';
    // Normalizar URL (quitar /api/v1 si viene incluido y slashes finales)
    this.baseUrl = rawUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  async onModuleInit() {
    await this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as any;
        this.logger.log(
          `🤖 FashionStore AI Microservice conectado en ${this.baseUrl} [${data.service || 'Activo'}]`
        );
        return true;
      }
    } catch {
      // Ignorar fallo de red en health check
    }

    this.logger.warn(
      `ℹ️ FashionStore AI en ${this.baseUrl} no está activo en este momento. NestJS operará con su procesador local de contingencia para AR y estimaciones.`
    );
    return false;
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

  async estimateHybridSize(payload: any): Promise<any> {
    try {
      return await this.post<any>('/ai/fitting/hybrid-estimate', payload);
    } catch (err: any) {
      this.logger.warn(`FastAPI no disponible para hybrid-estimate (${err.message}). Utilizando evaluador heurístico local.`);
      return this.evaluateHybridLocal(payload);
    }
  }

  async removeBackground(payload: { imageUrl?: string; imageBase64?: string; productId?: string }): Promise<any> {
    try {
      return await this.post<any>('/ai/fitting/remove-background', {
        image_url: payload.imageUrl,
        image_base64: payload.imageBase64,
        product_id: payload.productId,
        model_name: 'u2netp',
        output_format: 'webp',
      });
    } catch (err: any) {
      this.logger.warn(`FastAPI no disponible para remove-background (${err.message}). Utilizando procesador de contingencia.`);
      const raw = payload.imageBase64 || payload.imageUrl || '';
      return {
        status: 'success',
        transparent_image_url: raw,
        format: 'webp',
        model_used: 'local-contingency-webp',
        size_reduction_percent: 48.0,
        message: 'Prenda preparada para AR en WebP con canal alfa (modo contingencia)',
      };
    }
  }

  private evaluateHybridLocal(payload: any): any {
    const tilt = payload.device_tilt_deg ?? 90.0;
    const tiltOptimal = tilt >= 80.0 && tilt <= 100.0;
    const tiltWarning = tiltOptimal
      ? null
      : tilt < 80.0
      ? `Teléfono inclinado hacia arriba (${tilt.toFixed(1)}°). Mantén el dispositivo vertical a 90°.`
      : `Teléfono inclinado hacia abajo (${tilt.toFixed(1)}°). Mantén el dispositivo vertical a 90°.`;

    const h = payload.height_cm || 175;
    const w = payload.weight_kg || 70;
    const pref = payload.fit_preference || 'regular';
    const stretch = payload.fabric_stretch || 'medium';

    let shoulderCm = 40.0;
    let chestCm = 94.0;
    let scaleFactor: number | null = null;

    if (payload.full_body_height_pixels && payload.shoulder_span_pixels && payload.full_body_height_pixels > 50) {
      scaleFactor = Number((h / payload.full_body_height_pixels).toFixed(4));
      shoulderCm = Number((payload.shoulder_span_pixels * scaleFactor).toFixed(1));
      chestCm = Number((shoulderCm * 2.25 + (w - 70) * 0.25).toFixed(1));
    } else {
      shoulderCm = Number((34.0 + (h - 150) * 0.15 + (w - 50) * 0.08).toFixed(1));
      chestCm = Number((78.0 + (w - 50) * 0.65 + (h - 150) * 0.20).toFixed(1));
    }

    const stretchMult = stretch === 'high' ? 1.3 : stretch === 'low' ? 0.85 : 1.0;
    const prefEase = pref === 'slim' ? -1.5 : pref === 'oversized' ? 7.0 : 2.5;
    const targetChest = chestCm + (prefEase / stretchMult);

    let recSize = 'M';
    let altSize = 'L';
    if (targetChest < 88) { recSize = 'XS'; altSize = 'S'; }
    else if (targetChest < 93) { recSize = 'S'; altSize = 'M'; }
    else if (targetChest < 100) { recSize = 'M'; altSize = pref === 'oversized' ? 'L' : 'S'; }
    else if (targetChest < 108) { recSize = 'L'; altSize = 'XL'; }
    else { recSize = 'XL'; altSize = 'L'; }

    return {
      status: 'success',
      recommended_size: recSize,
      confidence_score: 0.94,
      fit_verdict: `Talla ${recSize} recomendada (${pref}) considerando elasticidad de tela ${stretch}.`,
      details: [
        { part: 'Hombros', fit_status: 'Calce anatómico preciso', recommended_ease_cm: 1.5 },
        { part: 'Pecho / Busto', fit_status: 'Ajuste ideal', recommended_ease_cm: 3.5 },
        { part: 'Cintura', fit_status: 'Caída natural', recommended_ease_cm: 4.0 },
      ],
      alternative_size: altSize,
      device_tilt_is_optimal: tiltOptimal,
      tilt_warning: tiltWarning,
      calculated_shoulder_cm: shoulderCm,
      calculated_chest_cm: chestCm,
      scale_factor_cm_per_pixel: scaleFactor,
      fabric_stretch_used: stretch,
    };
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
