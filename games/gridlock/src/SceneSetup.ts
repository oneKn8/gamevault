import {
  Scene, PerspectiveCamera, WebGLRenderer, Color,
  AmbientLight, DirectionalLight,
} from 'three';
import {
  BACKGROUND_COLOR, CAMERA_FOV,
  AMBIENT_INTENSITY, KEY_LIGHT_INTENSITY, FILL_LIGHT_INTENSITY,
} from './constants';

export interface SceneObjects {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}

export function createScene(canvas: HTMLCanvasElement): SceneObjects {
  const scene = new Scene();
  scene.background = new Color(BACKGROUND_COLOR);

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Three-point lighting
  const ambient = new AmbientLight(0xffffff, AMBIENT_INTENSITY);
  scene.add(ambient);

  const keyLight = new DirectionalLight(0xffffff, KEY_LIGHT_INTENSITY);
  keyLight.position.set(10, 20, 12);
  scene.add(keyLight);

  const fillLight = new DirectionalLight(0xffffff, FILL_LIGHT_INTENSITY);
  fillLight.position.set(-8, 15, 8);
  scene.add(fillLight);

  return { scene, camera, renderer };
}
