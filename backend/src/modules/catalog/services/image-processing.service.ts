import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service.js';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessArImageResult {
  arImageUrl: string;
  format: 'webp';
  modelUsed: string;
  sizeReductionPercent: number;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly uploadDir: string;

  constructor(private readonly aiClient: AiClientService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'ar-garments');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Procesa la imagen de una prenda eliminando el fondo mediante IA ligera
   * y generando una textura WebP con canal alfa optimizada para el Probador Virtual AR.
   */
  async processAndRemoveBackground(
    productId: string,
    imageSource: string,
  ): Promise<ProcessArImageResult> {
    this.logger.log(`Iniciando recorte de fondo IA para prenda ID: ${productId}`);

    const isBase64 = imageSource.startsWith('data:image');
    const aiResult = await this.aiClient.removeBackground({
      productId,
      imageBase64: isBase64 ? imageSource : undefined,
      imageUrl: !isBase64 ? imageSource : undefined,
    });

    let finalUrl = aiResult.transparent_image_url;

    // Si el resultado es un DataURL base64, guardamos opcionalmente una copia persistente en disco en formato WebP
    if (finalUrl.startsWith('data:image')) {
      try {
        const matches = finalUrl.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `ar_${productId}_${Date.now()}.webp`;
          const filePath = path.join(this.uploadDir, filename);
          fs.writeFileSync(filePath, buffer);
          this.logger.log(`Textura WebP guardada en disco: ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo persistir copia en disco: ${err.message}. Se mantiene data URL.`);
      }
    }

    return {
      arImageUrl: finalUrl,
      format: 'webp',
      modelUsed: aiResult.model_used || 'u2netp-lightweight',
      sizeReductionPercent: aiResult.size_reduction_percent || 50.0,
    };
  }
}
