import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Color,
} from 'three';

export interface SceneObjects {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}

/** Creates and configures the Three.js scene, camera, renderer, and lights. */
export function createScene(canvas: HTMLCanvasElement): SceneObjects {
  // Scene with a clean dark background (not pitch black)
  const scene = new Scene();
  scene.background = new Color(0x1a1a2e);

  // Camera: positioned to see the 10x20 board with a slight perspective angle
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(5, 10, 24);
  camera.lookAt(5, 10, 0);

  // Renderer
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Brighter, more even lighting for a clean look
  const ambient = new AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const directional = new DirectionalLight(0xffffff, 0.6);
  directional.position.set(10, 20, 15);
  scene.add(directional);

  // Fill light from the opposite side to reduce harsh shadows
  const fill = new DirectionalLight(0xffffff, 0.3);
  fill.position.set(-5, 10, 10);
  scene.add(fill);

  return { scene, camera, renderer };
}
