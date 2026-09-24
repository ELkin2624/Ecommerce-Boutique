/**
 * Pose Frame Processor
 * FashionStore Virtual Try-On - Phase 3
 *
 * Worklet pipeline: Frame -> Resizer -> MoveNet runSync -> Decoder -> SharedValues
 *
 * NOTE: This worklet runs on the react-native-vision-camera-worklets Runtime
 * (IdentifiableExecutor). Reanimated runOnJS are "Remote Functions" in this
 * context and CANNOT be called synchronously here. All outputs MUST be written
 * to SharedValues directly — never via runOnJS.
 */

import type { Frame } from 'react-native-vision-camera';
import type { Resizer } from 'react-native-vision-camera-resizer';
import type { TfliteModel } from 'react-native-fast-tflite';
import type { SharedValue } from 'react-native-reanimated';
import type {
  PoseConfig,
  PoseLandmark,
  PoseMetrics,
  PoseStatus,
} from '../types/pose.types';
import { decodeMoveNetOutput } from '../utils/poseDecoder';
import { validatePose } from '../utils/poseValidation';
import { runMoveNetInference } from '../model/poseModel';

export interface PoseProcessorContext {
  readonly model: TfliteModel | null;
  readonly resizer: Resizer | null;
  readonly config: PoseConfig;
  readonly isInputInt32: boolean;
  readonly landmarksShared: SharedValue<readonly PoseLandmark[]>;
  readonly statusShared: SharedValue<PoseStatus>;
  /** Low-frequency metrics written directly in worklet; read via useAnimatedReaction on JS side. */
  readonly metricsShared: SharedValue<PoseMetrics>;
  readonly lastMetricsTimestamp: SharedValue<number>;
  readonly frameCountWindow: SharedValue<number>;
  readonly windowStartTime: SharedValue<number>;
}

/**
 * Processes a single camera frame for local pose estimation.
 * Executed directly on the native camera worklet thread.
 *
 * All outputs are written to SharedValues in the same worklet runtime.
 * No cross-runtime calls (runOnJS / Remote Functions) are performed here.
 */
export function processPoseFrame(
  frame: Frame,
  context: PoseProcessorContext
): void {
  'worklet';
  const {
    model,
    resizer,
    config,
    isInputInt32,
    landmarksShared,
    statusShared,
    metricsShared,
    lastMetricsTimestamp,
    frameCountWindow,
    windowStartTime,
  } = context;

  // If resources are not ready, discard frame immediately to prevent stalls
  if (model == null || resizer == null) {
    frame.dispose();
    return;
  }

  try {
    // 1. GPU-accelerated resize to 192x192 RGB uint8
    const resized = resizer.resize(frame);
    const pixelBuffer = resized.getPixelBuffer();

    // 2. Prepare input buffer matching model tensor expectations
    let inputBuffer: ArrayBuffer;
    if (isInputInt32) {
      const uint8 = new Uint8Array(pixelBuffer);
      const int32 = new Int32Array(uint8.length);
      for (let i = 0; i < uint8.length; i++) {
        int32[i] = uint8[i]!;
      }
      inputBuffer = int32.buffer;
    } else {
      inputBuffer = pixelBuffer;
    }

    // 3. Run synchronous inference BEFORE disposing resized GPUFrame
    const inferenceStart = performance.now();
    const outputBuffer = runMoveNetInference(model, inputBuffer);
    const inferenceTime = performance.now() - inferenceStart;

    // 4. Dispose resized GPU frame back to pool
    resized.dispose();

    // 5. Decode output Float32Array into structured landmarks
    if (outputBuffer != null) {
      const landmarks = decodeMoveNetOutput(outputBuffer);
      const validation = validatePose(landmarks, config);

      // High-frequency state update directly in SharedValues (zero JS bridge cost)
      landmarksShared.value = landmarks;
      statusShared.value = validation.status;

      // Telemetry metrics tracking
      frameCountWindow.value += 1;
      const currentTime = performance.now();

      if (currentTime - lastMetricsTimestamp.value >= config.throttleMetricsMs) {
        const elapsed = currentTime - windowStartTime.value;
        const fps =
          frameCountWindow.value > 0 && elapsed > 0
            ? (frameCountWindow.value * 1000) / elapsed
            : 0;

        lastMetricsTimestamp.value = currentTime;
        frameCountWindow.value = 0;
        windowStartTime.value = currentTime;

        // Write metrics directly to SharedValue — no cross-runtime call.
        // useAnimatedReaction on the JS side reads this at low frequency.
        metricsShared.value = {
          inferenceTimeMs: inferenceTime,
          inferenceFps: Math.round(fps * 10) / 10,
          validLandmarksCount: validation.validLandmarksCount,
          poseScore: Math.round(validation.poseScore * 100) / 100,
          timestamp: currentTime,
        };
      }
    }
  } catch (err) {
    if (__DEV__) {
      console.error('[processPoseFrame] Processing error:', err);
    }
  } finally {
    // 6. Always dispose original camera frame to prevent memory leaks and pipeline blockages
    frame.dispose();
  }
}
