/**
 * Pose Detection Hook
 * FashionStore Virtual Try-On - Phase 3
 *
 * Coordinates MoveNet model loading, GPU resizer, worklet pipeline,
 * and high-frequency SharedValues with zero UI thread overhead.
 *
 * FIX (Phase 3 Bug): Metrics are now communicated via metricsShared SharedValue
 * + useAnimatedReaction instead of runOnJS. This avoids the "Remote Function"
 * cross-runtime call error from vision-camera-worklets IdentifiableExecutor.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  useFrameOutput,
  type CameraFrameOutput,
  type Frame,
} from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import { useSharedValue, useAnimatedReaction, runOnJS, type SharedValue } from 'react-native-reanimated';
import type { TensorflowModelDelegate } from 'react-native-fast-tflite';
import {
  DEFAULT_POSE_CONFIG,
  INITIAL_POSE_METRICS,
  type PoseConfig,
  type PoseLandmark,
  type PoseMetrics,
  type PoseStatus,
} from '../types/pose.types';
import { usePoseModelLoader, type ModelValidationResult } from '../model/poseModelLoader';
import { processPoseFrame, type PoseProcessorContext } from '../processors/poseFrameProcessor';

export interface UsePoseDetectionOptions {
  /**
   * Whether pose detection is active (paired with camera lifecycle & screen focus).
   * @default true
   */
  readonly isActive?: boolean;
  /**
   * Configurable pose thresholds and telemetry intervals.
   */
  readonly config?: Partial<PoseConfig>;
  /**
   * Optional hardware accelerating delegates (defaults to CPU [] for maximum stability).
   */
  readonly delegates?: TensorflowModelDelegate[];
}

export interface UsePoseDetectionReturn {
  /**
   * Frame output instance for `<Camera outputs={[frameOutput]} />`.
   */
  readonly frameOutput: CameraFrameOutput;
  /**
   * High-frequency normalized landmarks stored in worklet memory for direct skeleton rendering.
   */
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  /**
   * Worklet-level pose status.
   */
  readonly statusShared: SharedValue<PoseStatus>;
  /**
   * React state representing high-level pose status (updated at low frequency).
   */
  readonly poseStatus: PoseStatus;
  /**
   * Telemetry metrics for debug overlay (FPS, latency, valid landmarks count).
   */
  readonly metrics: PoseMetrics;
  /**
   * Whether the MoveNet model is loaded and validated.
   */
  readonly isModelReady: boolean;
  /**
   * Model input/output validation metadata.
   */
  readonly modelValidation: ModelValidationResult | undefined;
}

export function usePoseDetection(
  options: UsePoseDetectionOptions = {}
): UsePoseDetectionReturn {
  const {
    isActive = true,
    config: userConfig,
    delegates = [],
  } = options;

  const mergedConfig: PoseConfig = useMemo(
    () => ({
      ...DEFAULT_POSE_CONFIG,
      ...userConfig,
    }),
    [userConfig]
  );

  // 1. Model Loader
  const modelState = usePoseModelLoader(delegates);
  const isModelReady = modelState.state === 'loaded';
  const model = modelState.state === 'loaded' ? modelState.model : null;
  const modelValidation = modelState.validation;

  // 2. GPU Resizer: 192x192 RGB uint8 interleaved with 'contain' scale mode
  const { resizer } = useResizer({
    width: 192,
    height: 192,
    channelOrder: 'rgb',
    dataType: 'uint8',
    scaleMode: 'contain',
    pixelLayout: 'interleaved',
  });

  // 3. High-frequency SharedValues in native memory
  const landmarksShared = useSharedValue<readonly PoseLandmark[]>([]);
  const statusShared = useSharedValue<PoseStatus>('idle');
  const lastMetricsTimestamp = useSharedValue(0);
  const frameCountWindow = useSharedValue(0);
  const windowStartTime = useSharedValue(0);

  // 4. metricsShared: Low-frequency SharedValue written by worklet, read by JS via useAnimatedReaction.
  //    This avoids cross-runtime runOnJS Remote Function calls from the VisionCamera worklet runtime.
  const metricsShared = useSharedValue<PoseMetrics>(INITIAL_POSE_METRICS);

  // 5. Low-frequency JS UI state (updated only when metricsShared changes)
  const [metrics, setMetrics] = useState<PoseMetrics>(INITIAL_POSE_METRICS);
  const [poseStatus, setPoseStatus] = useState<PoseStatus>('loading-model');

  const handleMetricsJS = useCallback((newMetrics: PoseMetrics) => {
    setMetrics(newMetrics);
  }, []);

  const handleStatusJS = useCallback((newStatus: PoseStatus) => {
    setPoseStatus(newStatus);
  }, []);

  // Bridge worklet metrics -> React state (runs on UI thread, not camera worklet thread)
  useAnimatedReaction(
    () => metricsShared.value,
    (current, previous) => {
      if (previous == null || current.timestamp !== previous.timestamp) {
        runOnJS(handleMetricsJS)(current);
      }
    },
    [handleMetricsJS]
  );

  // Bridge worklet status -> React state
  useAnimatedReaction(
    () => statusShared.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(handleStatusJS)(current);
      }
    },
    [handleStatusJS]
  );

  // Synchronize model load state with statusShared
  useEffect(() => {
    if (modelState.state === 'loading') {
      statusShared.value = 'loading-model';
    } else if (modelState.state === 'error') {
      statusShared.value = 'error';
    } else if (modelState.state === 'loaded') {
      statusShared.value = 'ready';
    }
  }, [modelState.state, statusShared]);

  // When inactive or backgrounded, reset telemetry
  useEffect(() => {
    if (!isActive) {
      statusShared.value = 'idle';
      landmarksShared.value = [];
    }
  }, [isActive, landmarksShared, statusShared]);

  // Model input tensor data type check
  const isInputInt32 = useMemo(
    () => modelValidation?.inputDataType === 'int32',
    [modelValidation?.inputDataType]
  );

  // 6. VisionCamera v5 Frame Output
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    enablePreviewSizedOutputBuffers: true,
    dropFramesWhileBusy: true,
    onFrame(frame: Frame) {
      'worklet';
      if (!isActive) {
        frame.dispose();
        return;
      }

      const context: PoseProcessorContext = {
        model,
        resizer: resizer ?? null,
        config: mergedConfig,
        isInputInt32,
        landmarksShared,
        statusShared,
        metricsShared,
        lastMetricsTimestamp,
        frameCountWindow,
        windowStartTime,
      };

      processPoseFrame(frame, context);
    },
    onFrameDropped(reason) {
      if (__DEV__) {
        console.debug(`[PoseDetection] Frame dropped: ${reason}`);
      }
    },
  });

  return {
    frameOutput,
    landmarksShared,
    statusShared,
    poseStatus,
    metrics,
    isModelReady,
    modelValidation,
  };
}
