/**
 * Pose Model Loader & Tensor Validation
 * FashionStore Virtual Try-On - Phase 3
 *
 * Loads the local MoveNet SinglePose Lightning TFLite model and validates
 * tensor signatures at runtime without assuming configuration blindly.
 */

import { useState, useEffect } from 'react';
import { Paths, File as ExpoFile } from 'expo-file-system';
import { NativeModules } from 'react-native';
import { Asset } from 'expo-asset';
import {
  loadTensorflowModel,
  type TensorflowModelDelegate,
  type TfliteModel,
} from 'react-native-fast-tflite';

// Asset reference for the local MoveNet model
export const MOVENET_MODEL_ASSET = require('../../../../../assets/models/pose/movenet_lightning.tflite');

export const EXPECTED_INPUT_SHAPE = [1, 192, 192, 3] as const;
export const EXPECTED_OUTPUT_SHAPE = [1, 1, 17, 3] as const;

export interface ModelValidationResult {
  readonly isValid: boolean;
  readonly inputShape: readonly number[];
  readonly inputDataType: string;
  readonly outputShape: readonly number[];
  readonly outputDataType: string;
  readonly delegates: readonly string[];
  readonly error?: string;
}

/**
 * Validates the loaded model's inputs and outputs against MoveNet specifications.
 */
export function validateMoveNetModel(model: TfliteModel): ModelValidationResult {
  if (!model.inputs || model.inputs.length === 0) {
    return {
      isValid: false,
      inputShape: [],
      inputDataType: 'unknown',
      outputShape: [],
      outputDataType: 'unknown',
      delegates: model.delegates ?? [],
      error: 'Model has no inputs defined',
    };
  }

  if (!model.outputs || model.outputs.length === 0) {
    return {
      isValid: false,
      inputShape: model.inputs[0]?.shape ?? [],
      inputDataType: model.inputs[0]?.dataType ?? 'unknown',
      outputShape: [],
      outputDataType: 'unknown',
      delegates: model.delegates ?? [],
      error: 'Model has no outputs defined',
    };
  }

  const input = model.inputs[0]!;
  const output = model.outputs[0]!;

  const inputShapeMatch =
    input.shape.length === 4 &&
    input.shape[1] === 192 &&
    input.shape[2] === 192 &&
    input.shape[3] === 3;

  const outputShapeMatch =
    output.shape.length === 4 &&
    output.shape[2] === 17 &&
    output.shape[3] === 3;

  if (__DEV__) {
    console.log('[MoveNet] Model loaded successfully:');
    console.log(`  - Input: name="${input.name}", shape=[${input.shape.join(', ')}], type=${input.dataType}`);
    console.log(`  - Output: name="${output.name}", shape=[${output.shape.join(', ')}], type=${output.dataType}`);
    console.log(`  - Delegates: [${(model.delegates ?? []).join(', ')}]`);
  }

  if (!inputShapeMatch) {
    return {
      isValid: false,
      inputShape: input.shape,
      inputDataType: input.dataType,
      outputShape: output.shape,
      outputDataType: output.dataType,
      delegates: model.delegates ?? [],
      error: `Unexpected input shape [${input.shape.join(', ')}], expected [1, 192, 192, 3]`,
    };
  }

  if (!outputShapeMatch) {
    return {
      isValid: false,
      inputShape: input.shape,
      inputDataType: input.dataType,
      outputShape: output.shape,
      outputDataType: output.dataType,
      delegates: model.delegates ?? [],
      error: `Unexpected output shape [${output.shape.join(', ')}], expected [1, 1, 17, 3]`,
    };
  }

  return {
    isValid: true,
    inputShape: input.shape,
    inputDataType: input.dataType,
    outputShape: output.shape,
    outputDataType: output.dataType,
    delegates: model.delegates ?? [],
  };
}

export type PoseModelLoaderState =
  | { readonly state: 'loading'; readonly model: undefined; readonly error: undefined; readonly validation: undefined }
  | { readonly state: 'loaded'; readonly model: TfliteModel; readonly error: undefined; readonly validation: ModelValidationResult }
  | { readonly state: 'error'; readonly model: undefined; readonly error: Error; readonly validation: ModelValidationResult | undefined };

/**
 * Hook to load and validate the MoveNet TFLite model.
 * Defaults to CPU delegate (`[]`) for maximum stability across devices.
 * Uses an offline-first strategy: checks local persistent document directory first,
 * then tries LAN Metro IP, USB tunnel, and Expo Asset before falling back to require.
 */
export function usePoseModelLoader(
  delegates: TensorflowModelDelegate[] = []
): PoseModelLoaderState {
  const [state, setState] = useState<PoseModelLoaderState>({
    state: 'loading',
    model: undefined,
    error: undefined,
    validation: undefined,
  });

  const delegatesKey = JSON.stringify(delegates);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        setState({ state: 'loading', model: undefined, error: undefined, validation: undefined });

        let model: TfliteModel | undefined;
        const targetFile = new ExpoFile(Paths.document, 'movenet_lightning.tflite');

        // Strategy 1: Check if already stored on persistent disk (offline-first)
        try {
          if (targetFile.exists && targetFile.size > 1000000) {
            if (__DEV__) {
              console.log('[MoveNet] Found persistent model on disk (size:', targetFile.size, 'bytes). Loading locally:', targetFile.uri);
            }
            model = await loadTensorflowModel({ url: targetFile.uri }, delegates);
          }
        } catch (diskErr) {
          if (__DEV__) {
            console.warn('[MoveNet] Disk check failed, proceeding to network resolution:', diskErr);
          }
        }

        // Strategy 2: Download directly from Metro using the actual bundle script host (Wi-Fi LAN or USB)
        if (!model) {
          try {
            const scriptURL: string = NativeModules.SourceCode?.scriptURL ?? '';
            const match = scriptURL.match(/^https?:\/\/([^/]+)/);
            const metroHost = match ? match[1] : null;

            const candidateHosts = [
              metroHost,
              '192.168.8.94:8081',
              'localhost:8081',
            ].filter((h): h is string => Boolean(h));

            for (const host of candidateHosts) {
              try {
                const targetUrl = `http://${host}/assets/assets/models/pose/movenet_lightning.tflite`;
                if (__DEV__) {
                  console.log(`[MoveNet] Attempting download from ${targetUrl} to disk...`);
                }
                const downloadedFile = await ExpoFile.downloadFileAsync(targetUrl, targetFile, { idempotent: true });
                if (downloadedFile.exists && downloadedFile.size > 1000000) {
                  if (__DEV__) {
                    console.log('[MoveNet] Model downloaded successfully to disk:', downloadedFile.uri);
                  }
                  model = await loadTensorflowModel({ url: downloadedFile.uri }, delegates);
                  break;
                }
              } catch {
                // Try next candidate host
              }
            }
          } catch (netDownloadErr) {
            if (__DEV__) {
              console.warn('[MoveNet] Direct Metro download failed:', netDownloadErr);
            }
          }
        }

        // Strategy 3: Attempt loading via Expo Asset cache
        if (!model) {
          try {
            const [asset] = await Asset.loadAsync(MOVENET_MODEL_ASSET);
            const localUri = asset?.localUri;
            if (localUri) {
              if (__DEV__) {
                console.log('[MoveNet] Loading model from Expo Asset localUri:', localUri);
              }
              model = await loadTensorflowModel({ url: localUri }, delegates);
            }
          } catch (assetErr) {
            if (__DEV__) {
              console.warn('[MoveNet] Local Expo Asset load failed:', assetErr);
            }
          }
        }

        // Strategy 4: Fallback to direct require
        if (!model) {
          if (__DEV__) {
            console.log('[MoveNet] Loading model via direct require asset...');
          }
          model = await loadTensorflowModel(MOVENET_MODEL_ASSET, delegates);
        }

        if (isCancelled) return;

        const validation = validateMoveNetModel(model);
        if (!validation.isValid) {
          setState({
            state: 'error',
            model: undefined,
            error: new Error(validation.error ?? 'Invalid model tensor signatures'),
            validation,
          });
          return;
        }

        setState({
          state: 'loaded',
          model,
          error: undefined,
          validation,
        });
      } catch (err) {
        if (isCancelled) return;
        const rawMsg = err instanceof Error ? err.message : String(err);
        let enhancedError = err instanceof Error ? err : new Error(rawMsg);

        if (rawMsg.includes('ConnectException') || rawMsg.includes('localhost:8081')) {
          enhancedError = new Error(
            `No se pudo conectar a Metro bundler para descargar el modelo TFLite. ` +
            `Verifica que el teléfono y la PC estén en la misma red Wi-Fi o ejecuta en tu terminal: 'adb reverse tcp:8081 tcp:8081'. ` +
            `Detalle: ${rawMsg}`
          );
        }

        console.error('[MoveNet] Failed to load model:', enhancedError);
        setState({
          state: 'error',
          model: undefined,
          error: enhancedError,
          validation: undefined,
        });
      }
    }

    load();

    return () => {
      isCancelled = true;
    };
  }, [delegatesKey]);

  return state;
}
