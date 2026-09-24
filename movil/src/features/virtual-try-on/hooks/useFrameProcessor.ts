import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useFrameOutput,
  type CameraFrameOutput,
  type Frame,
} from 'react-native-vision-camera';
import { runOnJS } from 'react-native-worklets';
import { useSharedValue } from 'react-native-reanimated';
import type {
  FrameProcessorMetrics,
  FrameProcessorConfig,
} from '../types/frame-processor.types';
import {
  createMetricsAccumulator,
  INITIAL_FRAME_METRICS,
} from '../utils/frameMetrics';
import { processCameraFrame } from '../processors/cameraFrameProcessor';

export interface UseFrameProcessorOptions extends FrameProcessorConfig {
  /**
   * Indica si la captura de cámara está activa (considerando appState y pausa del usuario).
   * @default true
   */
  isActive?: boolean;
}

export interface UseFrameProcessorReturn {
  /**
   * Instancia de salida nativa de frames para inyectar en `<Camera outputs={[frameOutput]} />`.
   */
  frameOutput: CameraFrameOutput;
  /**
   * Métricas de telemetría emitidas periódicamente desde el hilo de procesamiento.
   */
  metrics: FrameProcessorMetrics;
  /**
   * Bandera booleana indicando si el procesamiento está activo y recibiendo frames.
   */
  isProcessorActive: boolean;
}

/**
 * Hook que encapsula la inicialización, ciclo de vida y comunicación del Frame Processor.
 *
 * Sigue el pipeline:
 * Camera → Frame → Worklet (Hilo Nativo) → Procesamiento Mínimo → runOnJS (Throttled) → UI
 */
export function useFrameProcessor(
  options: UseFrameProcessorOptions = {},
): UseFrameProcessorReturn {
  const {
    throttleMs = 350,
    dropFramesWhileBusy = true,
    isActive = true,
  } = options;

  // Estado de telemetría para consumo de componentes de interfaz / debug overlay
  const [metrics, setMetrics] = useState<FrameProcessorMetrics>(INITIAL_FRAME_METRICS);

  // Acumulador de métricas mutable persistido entre frames en el hilo nativo
  const accumulator = useSharedValue(createMetricsAccumulator());

  // Callback en el hilo JS invocado por el worklet cuando transcurre el throttle
  const handleReceiveMetrics = useCallback((incomingMetrics: FrameProcessorMetrics) => {
    setMetrics(incomingMetrics);
  }, []);

  // Puente runOnJS para transferir datos ligeros del hilo nativo al hilo de React
  const notifyMetrics = useMemo(
    () => runOnJS(handleReceiveMetrics),
    [handleReceiveMetrics],
  );

  // Cuando la cámara se pausa o entra en reposo, reflejar inmediatamente el estado en las métricas
  useEffect(() => {
    if (!isActive) {
      setMetrics((prev) => ({
        ...prev,
        isProcessorActive: false,
        processingFps: 0,
      }));
    }
  }, [isActive]);

  // Construcción del Frame Output oficial de VisionCamera v5
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    enablePreviewSizedOutputBuffers: true,
    dropFramesWhileBusy,
    onFrame(frame: Frame) {
      'worklet';
      if (!isActive) {
        frame.dispose();
        return;
      }

      processCameraFrame(frame, {
        accumulator: accumulator,
        throttleMs,
        onEmitMetrics: notifyMetrics,
      });
    },
    onFrameDropped(reason) {
      if (__DEV__) {
        console.debug(`[FrameProcessor] Frame descartado: ${reason}`);
      }
    },
  });

  return {
    frameOutput,
    metrics,
    isProcessorActive: isActive && metrics.isProcessorActive,
  };
}
