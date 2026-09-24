import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service.js';

export interface CameraLandmarkDto {
  name: string;
  x: number;
  y: number;
  score?: number;
}

export interface HybridFittingInput {
  productId: string;
  heightCm: number;
  weightKg?: number;
  fitPreference?: 'slim' | 'regular' | 'oversized';
  deviceTiltDeg?: number;
  shoulderSpanPixels?: number;
  fullBodyHeightPixels?: number;
  landmarks?: CameraLandmarkDto[];
  fabricStretch?: 'low' | 'medium' | 'high';
  productVariants?: Array<{
    id: string;
    size: string;
    measurementsJson?: any;
  }>;
}

export interface HybridFittingOutput {
  recommendedSize: string;
  confidenceScore: number;
  fitVerdict: string;
  details: Array<{
    part: string;
    fitStatus: string;
    recommendedEaseCm: number;
  }>;
  alternativeSize?: string;
  deviceTiltIsOptimal: boolean;
  tiltWarning?: string | null;
  calculatedShoulderCm: number;
  calculatedChestCm: number;
  scaleFactorCmPerPixel?: number | null;
  fabricStretchUsed: string;
}

@Injectable()
export class HybridFittingService {
  private readonly logger = new Logger(HybridFittingService.name);

  // Multiplicador de elasticidad de tejido (Refinamiento Senior #3)
  private readonly STRETCH_FACTORS: Record<string, number> = {
    low: 0.85,    // Denim, gabardina, lino, cuero -> rigidez alta, holgura estricta
    medium: 1.0,  // Algodón estándar, mezclas suaves
    high: 1.30,   // Spandex, lycra, algodón elastano, tejido de punto deportivo
  };

  constructor(private readonly aiClient: AiClientService) {}

  /**
   * Ejecuta la Estrategia Híbrida Inteligente en 3 Pasos (Nike Fit / ASOS / Zalando)
   */
  async calculateHybridFit(input: HybridFittingInput): Promise<HybridFittingOutput> {
    this.logger.log(`Calculando talla híbrida para producto ${input.productId} (Estatura: ${input.heightCm}cm)`);

    // Intentamos delegar al microservicio de IA FastAPI
    try {
      const aiResponse = await this.aiClient.estimateHybridSize({
        product_id: input.productId,
        height_cm: input.heightCm,
        weight_kg: input.weightKg,
        fit_preference: input.fitPreference || 'regular',
        device_tilt_deg: input.deviceTiltDeg ?? 90.0,
        shoulder_span_pixels: input.shoulderSpanPixels,
        full_body_height_pixels: input.fullBodyHeightPixels,
        landmarks: input.landmarks,
        fabric_stretch: input.fabricStretch || 'medium',
        variants_measurements: input.productVariants?.map((v) => ({
          size: v.size,
          measurementsJson: v.measurementsJson,
        })),
      });

      if (aiResponse && aiResponse.recommended_size) {
        return {
          recommendedSize: aiResponse.recommended_size,
          confidenceScore: aiResponse.confidence_score,
          fitVerdict: aiResponse.fit_verdict,
          details: aiResponse.details?.map((d: any) => ({
            part: d.part,
            fitStatus: d.fit_status,
            recommendedEaseCm: d.recommended_ease_cm,
          })) || [],
          alternativeSize: aiResponse.alternative_size,
          deviceTiltIsOptimal: aiResponse.device_tilt_is_optimal,
          tiltWarning: aiResponse.tilt_warning,
          calculatedShoulderCm: aiResponse.calculated_shoulder_cm,
          calculatedChestCm: aiResponse.calculated_chest_cm,
          scaleFactorCmPerPixel: aiResponse.scale_factor_cm_per_pixel,
          fabricStretchUsed: aiResponse.fabric_stretch_used || 'medium',
        };
      }
    } catch (err: any) {
      this.logger.warn(`FastAPI no disponible, ejecutando motor híbrido local: ${err.message}`);
    }

    // --- Motor Híbrido Local de Alta Precisión ---

    // 1. Verificación de Perspectiva (Refinamiento Senior #2)
    const tilt = input.deviceTiltDeg ?? 90.0;
    const isOptimalTilt = tilt >= 80.0 && tilt <= 100.0;
    let tiltWarning: string | null = null;
    if (!isOptimalTilt) {
      tiltWarning = tilt < 80.0
        ? `Inclinación contrapicada detectada (${tilt.toFixed(0)}°). Eleva el teléfono perpendicular al suelo (90°) para máxima precisión.`
        : `Inclinación picada detectada (${tilt.toFixed(0)}°). Mantén el dispositivo derecho a 90°.`;
    }

    // 2. Micro-Calibración Métrico-Anatómica (Paso 2)
    let scaleFactor: number | null = null;
    let calculatedShoulderCm = 40.0;
    let calculatedChestCm = 94.0;

    if (
      input.fullBodyHeightPixels &&
      input.fullBodyHeightPixels > 50 &&
      input.shoulderSpanPixels
    ) {
      scaleFactor = Number((input.heightCm / input.fullBodyHeightPixels).toFixed(4));
      calculatedShoulderCm = Number((input.shoulderSpanPixels * scaleFactor).toFixed(1));
      const weightOffset = input.weightKg ? (input.weightKg - 70.0) * 0.25 : 0;
      calculatedChestCm = Number((calculatedShoulderCm * 2.25 + weightOffset).toFixed(1));
    } else {
      const h = input.heightCm;
      const w = input.weightKg || h - 100;
      calculatedShoulderCm = Number((34.0 + (h - 150) * 0.15 + (w - 50) * 0.08).toFixed(1));
      calculatedChestCm = Number((78.0 + (w - 50) * 0.65 + (h - 150) * 0.20).toFixed(1));
    }

    // 3. Elasticidad de Tejido y Matching de Patronaje (Paso 3)
    const fabricStretch = input.fabricStretch || 'medium';
    const stretchFactor = this.STRETCH_FACTORS[fabricStretch] || 1.0;

    const fitPreference = input.fitPreference || 'regular';
    const prefEase = fitPreference === 'slim' ? -1.5 : fitPreference === 'oversized' ? 7.0 : 2.5;
    const targetChest = calculatedChestCm + (prefEase / stretchFactor);

    // Mapeo de variantes de la prenda
    const variants = input.productVariants || [];
    const sizeMap: Record<string, { shoulders: number; chest: number; waist: number }> = {};

    for (const v of variants) {
      const m = v.measurementsJson || {};
      if (m.chest_cm || m.bust_cm || m.shoulders_cm) {
        sizeMap[v.size] = {
          shoulders: Number(m.shoulders_cm || 40.0),
          chest: Number(m.chest_cm || m.bust_cm || 94.0),
          waist: Number(m.waist_cm || 76.0),
        };
      }
    }

    // Fallback estándar si el producto no tiene patronaje explícito
    if (Object.keys(sizeMap).length === 0) {
      sizeMap['XS'] = { shoulders: 36, chest: 84, waist: 64 };
      sizeMap['S'] = { shoulders: 38, chest: 88, waist: 68 };
      sizeMap['M'] = { shoulders: 40, chest: 94, waist: 74 };
      sizeMap['L'] = { shoulders: 42, chest: 100, waist: 80 };
      sizeMap['XL'] = { shoulders: 45, chest: 108, waist: 88 };
    }

    // Evaluación de distancia cuadrática ponderada
    const rankedSizes: Array<{ size: string; error: number }> = [];

    for (const [sizeLabel, measures] of Object.entries(sizeMap)) {
      let diffChest = measures.chest - targetChest;
      const diffShoulders = measures.shoulders - calculatedShoulderCm;

      // Si el tejido es de alta elasticidad, se penaliza menos el calce ceñido
      if (fabricStretch === 'high' && diffChest < 0) {
        diffChest = diffChest * 0.6;
      }

      const error = Math.sqrt(Math.pow(diffChest * 1.5, 2) + Math.pow(diffShoulders * 1.8, 2));
      rankedSizes.push({ size: sizeLabel, error });
    }

    rankedSizes.sort((a, b) => a.error - b.error);
    const recommendedSize = rankedSizes[0].size;
    const alternativeSize = rankedSizes.length > 1 ? rankedSizes[1].size : undefined;

    const minError = rankedSizes[0].error;
    const confidenceScore = Math.min(0.99, Math.max(0.75, Number((1.0 - minError / 50.0).toFixed(2))));

    const bestMeasures = sizeMap[recommendedSize];
    const details = [
      {
        part: 'Hombros',
        fitStatus: Math.abs(bestMeasures.shoulders - calculatedShoulderCm) <= 1.8 ? 'Calce anatómico exacto' : 'Holgura de hombro balanceada',
        recommendedEaseCm: Number((bestMeasures.shoulders - calculatedShoulderCm).toFixed(1)),
      },
      {
        part: 'Pecho / Busto',
        fitStatus: Math.abs(bestMeasures.chest - calculatedChestCm) <= 4.0 ? 'Ajuste ideal' : (bestMeasures.chest < calculatedChestCm ? 'Ajuste entallado' : 'Holgura confortable'),
        recommendedEaseCm: Number((bestMeasures.chest - calculatedChestCm).toFixed(1)),
      },
      {
        part: 'Cintura',
        fitStatus: 'Caída natural de prenda',
        recommendedEaseCm: Number((bestMeasures.waist - (calculatedChestCm * 0.8)).toFixed(1)),
      },
    ];

    const verdict = `Talla ${recommendedSize} recomendada (${fitPreference.toUpperCase()}) con ${Math.round(confidenceScore * 100)}% de coincidencia considerando elasticidad ${fabricStretch.toUpperCase()} del tejido.`;

    return {
      recommendedSize,
      confidenceScore,
      fitVerdict: verdict,
      details,
      alternativeSize,
      deviceTiltIsOptimal: isOptimalTilt,
      tiltWarning,
      calculatedShoulderCm,
      calculatedChestCm,
      scaleFactorCmPerPixel: scaleFactor,
      fabricStretchUsed: fabricStretch,
    };
  }
}
