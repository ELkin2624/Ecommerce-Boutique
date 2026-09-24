import type { Frame } from 'react-native-vision-camera';
import type { SharedValue } from 'react-native-reanimated';
import type {
  FrameMetricsAccumulator,
  FrameProcessorMetrics,
} from '../types/frame-processor.types';

export interface ProcessFrameContext {
  accumulator: SharedValue<FrameMetricsAccumulator>;
  throttleMs: number;
  onEmitMetrics: (metrics: FrameProcessorMetrics) => void;
}

/**
 * Función procesadora de frames para VisionCamera.
 *
 * Responsabilidad estricta:
 * 1. Inspeccionar metadata del frame (ancho, alto, timestamp).
 * 2. Registrar el frame en el acumulador y calcular FPS de procesamiento.
 * 3. Emitir periódicamente telemetría ligera a través de `onEmitMetrics` (usando runOnJS externamente).
 * 4. Liberar de forma garantizada e inmediata la memoria del buffer nativo mediante `frame.dispose()`.
 *
 * NOTA DE ARQUITECTURA:
 * En fases futuras (Fase 3+), esta función podrá evolucionar o ser sustituida por un procesador
 * que delegue en modelos TFLite sin afectar la arquitectura ni la UI de la cámara.
 */
export function processCameraFrame(
  frame: Frame,
  context: ProcessFrameContext,
): void {
  'worklet';
  try {
    if (!frame.isValid) {
      return;
    }

    const now = Date.now();
    const { width, height } = frame;
    
    // Leer el valor compartido actual
    const acc = context.accumulator.value;
    
    // Clonarlo para mutarlo y asignarlo de nuevo de manera segura en el hilo
    const nextAcc = {
      ...acc,
      framesCount: acc.framesCount + 1,
      windowFrameCount: acc.windowFrameCount + 1,
    };

    const windowDelta = now - nextAcc.windowStartTimestamp;
    if (windowDelta >= 500) {
      nextAcc.currentFps = (nextAcc.windowFrameCount / windowDelta) * 1000;
      nextAcc.windowStartTimestamp = now;
      nextAcc.windowFrameCount = 0;
    }

    // Estrangular emisión de métricas para no saturar el hilo JS
    if (now - nextAcc.lastEmittedTimestamp >= context.throttleMs) {
      nextAcc.lastEmittedTimestamp = now;
      context.onEmitMetrics({
        frameWidth: width,
        frameHeight: height,
        framesProcessed: nextAcc.framesCount,
        processingFps: Math.round(nextAcc.currentFps * 10) / 10,
        isProcessorActive: true,
        lastFrameTimestamp: now,
      });
    }

    // Guardar el estado nuevamente en la SharedValue
    context.accumulator.value = nextAcc;

  } catch (error) {
    // Manejo de errores silencioso en worklet para no tumbar la sesión de cámara
    console.warn('[processCameraFrame] Error procesando frame:', error);
  } finally {
    // OBLIGATORIO: Liberar el frame inmediatamente para devolver el buffer al hardware
    try {
      frame.dispose();
    } catch {
      // Si el frame ya fue invalidado por el hardware, ignorar
    }
  }
}
