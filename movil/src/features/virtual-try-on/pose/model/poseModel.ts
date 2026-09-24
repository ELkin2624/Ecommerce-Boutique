/**
 * Pose Model Inference Runner
 * FashionStore Virtual Try-On - Phase 3
 *
 * Encapsulates synchronous inference on TfliteModel in worklet environment.
 */

import type { TfliteModel } from 'react-native-fast-tflite';

/**
 * Runs synchronous inference for MoveNet on the worklet thread.
 *
 * @param model Loaded and validated TfliteModel
 * @param inputBuffer ArrayBuffer containing the resized 192x192 image tensor
 * @returns Float32Array of the output tensor, or null if inference failed
 */
export function runMoveNetInference(
  model: TfliteModel,
  inputBuffer: ArrayBuffer
): Float32Array | null {
  'worklet';
  try {
    const outputs = model.runSync([inputBuffer]);
    if (!outputs || outputs.length === 0 || !outputs[0]) {
      return null;
    }

    return new Float32Array(outputs[0]);
  } catch (error) {
    if (__DEV__) {
      console.error('[MoveNet] Inference runSync error:', error);
    }
    return null;
  }
}
