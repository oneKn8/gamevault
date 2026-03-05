import { PerspectiveCamera, Raycaster, Vector2, Plane, Vector3 } from 'three';
import { TILE_GAP } from './constants';

export class InputManager {
  private camera: PerspectiveCamera;
  private raycaster = new Raycaster();
  private mouse = new Vector2();
  private groundPlane = new Plane(new Vector3(0, 1, 0), 0);

  private tileClickCallback: ((row: number, col: number) => void) | null = null;
  private tileHoverCallback: ((row: number, col: number) => void) | null = null;
  private tileHoverEndCallback: (() => void) | null = null;
  private keyCallbacks: Map<string, () => void> = new Map();

  private gridSize = 8;
  private enabled = true;
  private canvas: HTMLCanvasElement;

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;

    canvas.addEventListener('click', this.handleClick.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseleave', () => this.tileHoverEndCallback?.());
    canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  setGridSize(size: number): void {
    this.gridSize = size;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  onTileClick(callback: (row: number, col: number) => void): void {
    this.tileClickCallback = callback;
  }

  onTileHover(callback: (row: number, col: number) => void): void {
    this.tileHoverCallback = callback;
  }

  onTileHoverEnd(callback: () => void): void {
    this.tileHoverEndCallback = callback;
  }

  onKey(key: string, callback: () => void): void {
    this.keyCallbacks.set(key.toLowerCase(), callback);
  }

  private getNDC(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private raycastToGrid(): { row: number; col: number } | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersection = new Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, intersection);
    if (!hit) return null;

    const col = Math.round(intersection.x / TILE_GAP);
    const row = Math.round(intersection.z / TILE_GAP);

    if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
      return { row, col };
    }
    return null;
  }

  private handleClick(e: MouseEvent): void {
    if (!this.enabled) return;
    this.getNDC(e.clientX, e.clientY);
    const cell = this.raycastToGrid();
    if (cell) {
      this.tileClickCallback?.(cell.row, cell.col);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled) return;
    this.getNDC(e.clientX, e.clientY);
    const cell = this.raycastToGrid();
    if (cell) {
      this.tileHoverCallback?.(cell.row, cell.col);
    } else {
      this.tileHoverEndCallback?.();
    }
  }

  private handleTouch(e: TouchEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.getNDC(touch.clientX, touch.clientY);
    const cell = this.raycastToGrid();
    if (cell) {
      this.tileClickCallback?.(cell.row, cell.col);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const callback = this.keyCallbacks.get(key);
    if (callback) {
      callback();
    }
  }
}
