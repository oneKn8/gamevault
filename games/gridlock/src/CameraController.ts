import { PerspectiveCamera, Vector3 } from 'three';
import {
  CAMERA_FOV, CAMERA_MARGIN_FACTOR, CAMERA_TILT_ANGLE,
  CAMERA_BREATHE_AMPLITUDE, CAMERA_BREATHE_FREQ,
  CAMERA_SHAKE_DURATION,
} from './constants';

export class CameraController {
  private camera: PerspectiveCamera;
  private basePosition = new Vector3();
  private lookTarget = new Vector3();

  // Breathing
  private breatheOffset = 0;

  // Shake
  private shakeIntensity = 0;
  private shakeTimer = 0;
  private shakeOffsetX = 0;
  private shakeOffsetZ = 0;

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  setTarget(gridSize: number): void {
    const halfGrid = (gridSize - 1) / 2;

    // Board center in world coords
    this.lookTarget.set(halfGrid, 0, halfGrid);

    // Camera distance based on grid size
    const fovRad = (CAMERA_FOV * Math.PI) / 180;
    const distance = (gridSize / 2) / Math.tan(fovRad / 2) * CAMERA_MARGIN_FACTOR;

    // Position camera at tilt angle
    const tiltRad = (CAMERA_TILT_ANGLE * Math.PI) / 180;
    const y = distance * Math.sin(tiltRad);
    const horizontalDist = distance * Math.cos(tiltRad);

    this.basePosition.set(halfGrid, y, halfGrid + horizontalDist);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.lookTarget);
  }

  shake(intensity: number): void {
    this.shakeIntensity = intensity;
    this.shakeTimer = CAMERA_SHAKE_DURATION;
  }

  update(dt: number, time: number): void {
    // Breathing
    this.breatheOffset = Math.sin(time * Math.PI * 2 * CAMERA_BREATHE_FREQ) * CAMERA_BREATHE_AMPLITUDE;

    // Shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / CAMERA_SHAKE_DURATION);
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.shakeOffsetZ = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetZ = 0;
    }

    // Apply
    this.camera.position.set(
      this.basePosition.x + this.shakeOffsetX,
      this.basePosition.y + this.breatheOffset,
      this.basePosition.z + this.shakeOffsetZ,
    );
    this.camera.lookAt(this.lookTarget);
  }
}
