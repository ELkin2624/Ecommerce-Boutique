export type CameraPosition = 'front' | 'back';

export type PermissionStatus = 'granted' | 'denied' | 'not-determined';

export type CameraStatus = 'active' | 'paused';

export interface CameraState {
  position: CameraPosition;
  isActive: boolean;
  targetFps: number;
}

export interface DebugCameraMetrics {
  fps: number;
  position: CameraPosition;
  isActive: boolean;
  sensorName?: string;
}
