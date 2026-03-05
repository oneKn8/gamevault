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
  // Scene
  const scene = new Scene();
  scene.background = new Color(0x0a0a0a);

  // Camera: positioned to see the 10x20 board with a slight perspective angle
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  // Board center is at (5, 10, 0). Camera looks from slight angle for 3D depth.
  camera.position.set(5, 10, 24);
  camera.lookAt(5, 10, 0);

  // Renderer
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lighting
  const ambient = new AmbientLight(0x404040, 0.6);
  scene.add(ambient);

  const directional = new DirectionalLight(0xffffff, 0.8);
  directional.position.set(10, 20, 15);
  scene.add(directional);

  return { scene, camera, renderer };
}
