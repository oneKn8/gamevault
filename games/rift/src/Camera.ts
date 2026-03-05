import { ARENA_WIDTH, ARENA_HEIGHT } from '@gamevault/rift-shared';

export class Camera {
  x = 0;
  y = 0;
  private viewWidth: number;
  private viewHeight: number;
  private lerpSpeed = 5;

  constructor(viewWidth: number, viewHeight: number) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  setViewSize(w: number, h: number): void {
    this.viewWidth = w;
    this.viewHeight = h;
  }

  follow(targetX: number, targetY: number, dt: number): void {
    const desiredX = targetX - this.viewWidth / 2;
    const desiredY = targetY - this.viewHeight / 2;

    const t = 1 - Math.exp(-this.lerpSpeed * dt);
    this.x += (desiredX - this.x) * t;
    this.y += (desiredY - this.y) * t;

    // Clamp to arena bounds
    this.x = Math.max(0, Math.min(ARENA_WIDTH - this.viewWidth, this.x));
    this.y = Math.max(0, Math.min(ARENA_HEIGHT - this.viewHeight, this.y));
  }

  snapTo(targetX: number, targetY: number): void {
    this.x = targetX - this.viewWidth / 2;
    this.y = targetY - this.viewHeight / 2;
    this.x = Math.max(0, Math.min(ARENA_WIDTH - this.viewWidth, this.x));
    this.y = Math.max(0, Math.min(ARENA_HEIGHT - this.viewHeight, this.y));
  }
}
