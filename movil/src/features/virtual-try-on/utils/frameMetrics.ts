import type {
  FrameMetricsAccumulator,
  FrameProcessorMetrics,
} from '../types/frame-processor.types';

/** Crea un acumulador inicial para registrar telemetría de frames. */
export function createMetricsAccumulator(): FrameMetricsAccumulator {
  'worklet';
  const now = Date.now();
  return {
    framesCount: 0,
    windowStartTimestamp: now,
    windowFrameCount: 0,
    lastEmittedTimestamp: 0,
    currentFps: 0,
  };
}

/**
 * Actualiza el acumulador tras la llegada de un nuevo frame.
 * Calcula una tasa de FPS suavizada usando una ventana temporal deslizante (~1000 ms).
 *
 * @param acc Acumulador mutable
 * @param now Timestamp actual en milisegundos
 */
export function recordFrameArrival(
  acc: FrameMetricsAccumulator,
  now: number,
): void {
  'worklet';
  acc.framesCount += 1;
  acc.windowFrameCount += 1;

  const windowDelta = now - acc.windowStartTimestamp;
  // Actualizar cálculo de FPS si la ventana temporal supera 500ms
  if (windowDelta >= 500) {
    acc.currentFps = (acc.windowFrameCount / windowDelta) * 1000;
    acc.windowStartTimestamp = now;
    acc.windowFrameCount = 0;
  }
}

/**
 * Determina si ha transcurrido el tiempo suficiente (throttle) para notificar
 * de forma segura al hilo principal de JavaScript sin saturarlo.
 *
 * @param acc Acumulador de métricas
 * @param now Timestamp actual en ms
 * @param throttleMs Intervalo mínimo entre actualizaciones (default: 350 ms)
 */
export function shouldEmitMetrics(
  acc: FrameMetricsAccumulator,
  now: number,
  throttleMs: number = 350,
): boolean {
  'worklet';
  return now - acc.lastEmittedTimestamp >= throttleMs;
}

/**
 * Genera el snapshot inmutable de métricas listo para ser enviado a la UI.
 */
export function buildMetricsSnapshot(
  acc: FrameMetricsAccumulator,
  width: number,
  height: number,
  now: number,
): FrameProcessorMetrics {
  'worklet';
  acc.lastEmittedTimestamp = now;
  return {
    frameWidth: width,
    frameHeight: height,
    framesProcessed: acc.framesCount,
    processingFps: Math.round(acc.currentFps * 10) / 10,
    isProcessorActive: true,
    lastFrameTimestamp: now,
  };
}

/**
 * Métricas iniciales por defecto cuando el procesador está inactivo.
 */
export const INITIAL_FRAME_METRICS: FrameProcessorMetrics = {
  frameWidth: 0,
  frameHeight: 0,
  framesProcessed: 0,
  processingFps: 0,
  isProcessorActive: false,
  lastFrameTimestamp: 0,
};
