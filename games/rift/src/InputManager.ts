import type { InputState } from '@gamevault/rift-shared';

export class InputManager {
  private keys = new Set<string>();
  private mouseX = 0;
  private mouseY = 0;
  private mouseDown = false;
  private phaseShiftPressed = false;
  private canvasRect: DOMRect | null = null;
  private canvas: HTMLCanvasElement;
  private scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      if (e.code === 'Space') {
        this.phaseShiftPressed = true;
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener('mousemove', (e) => {
      this.updateMousePos(e.clientX, e.clientY);
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateCanvasRect(scale: number): void {
    this.canvasRect = this.canvas.getBoundingClientRect();
    this.scale = scale;
  }

  private updateMousePos(clientX: number, clientY: number): void {
    if (!this.canvasRect) this.canvasRect = this.canvas.getBoundingClientRect();
    this.mouseX = (clientX - this.canvasRect.left) / this.scale;
    this.mouseY = (clientY - this.canvasRect.top) / this.scale;
  }

  getInput(playerX: number, playerY: number, cameraX: number, cameraY: number): InputState {
    let moveX = 0;
    let moveY = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) moveY = -1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) moveY = 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) moveX = -1;
    if (this.keys.has('d') || this.keys.has('arrowright')) moveX = 1;

    // Aim angle from player screen pos to mouse
    const screenPlayerX = playerX - cameraX;
    const screenPlayerY = playerY - cameraY;
    const aimAngle = Math.atan2(this.mouseY - screenPlayerY, this.mouseX - screenPlayerX);

    const phaseShift = this.phaseShiftPressed;
    this.phaseShiftPressed = false;

    return {
      moveX,
      moveY,
      aimAngle,
      phaseShift,
      attack: this.mouseDown,
    };
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  isSpacePressed(): boolean {
    const pressed = this.phaseShiftPressed;
    // Don't consume here - let getInput handle it
    return pressed || this.keys.has(' ');
  }

  isAnyKeyDown(): boolean {
    return this.keys.size > 0 || this.mouseDown;
  }
}
