/**
 * Métricas calculadas por el pipeline del Frame Processor.
 * Representa datos mínimos y ligeros comunicados a la interfaz de usuario.
 */
export interface FrameProcessorMetrics {
  /** Ancho en píxeles del frame capturado */
  frameWidth: number;
  /** Alto en píxeles del frame capturado */
  frameHeight: number;
  /** Cantidad acumulada de frames procesados con éxito */
  framesProcessed: number;
  /** Frecuencia estimada de procesamiento en frames por segundo (FPS) */
  processingFps: number;
  /** Indicador de si el pipeline está activamente procesando frames */
  isProcessorActive: boolean;
  /** Timestamp del último frame recibido (ms) */
  lastFrameTimestamp: number;
}

/**
 * Opciones de configuración para el Frame Processor.
 */
export interface FrameProcessorConfig {
  /**
   * Intervalo mínimo en milisegundos para notificar métricas al hilo JavaScript (throttling).
   * Evita saturar el event loop y previene re-renders excesivos en React.
   * @default 350
   */
  throttleMs?: number;

  /**
   * Si es true, el pipeline de la cámara descartará automáticamente frames cuando el procesador esté ocupado.
   * @default true
   */
  dropFramesWhileBusy?: boolean;
}

/**
 * Estado interno mutable utilizado para contabilizar y calcular métricas dentro del Worklet.
 */
export interface FrameMetricsAccumulator {
  framesCount: number;
  windowStartTimestamp: number;
  windowFrameCount: number;
  lastEmittedTimestamp: number;
  currentFps: number;
}
