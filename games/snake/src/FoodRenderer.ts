import type { GridPosition } from './types';
import { FOOD, HUD_HEIGHT } from './constants';

/**
 * Renders the food item as a clean red circle with subtle
 * pulsing animation and a highlight.
 */
export class FoodRenderer {
  /** Accumulates elapsed time for pulsing animation. */
  pulseTime: number;

  constructor() {
    this.pulseTime = 0;
  }

  /**
   * Draw the food item at the given grid position.
   */
  draw(ctx: CanvasRenderingContext2D, pos: GridPosition, cellSize: number): void {
    this.pulseTime += 0.04;

    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2 + HUD_HEIGHT;
    const baseRadius = cellSize / 2 - 3;
    const pulse = 1 + Math.sin(this.pulseTime * 3) * 0.08;
    const radius = baseRadius * pulse;

    // Shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // Main body.
    ctx.fillStyle = FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight for depth.
    const grad = ctx.createRadialGradient(
      cx - radius * 0.25, cy - radius * 0.25, 0,
      cx, cy, radius,
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Small leaf/stem on top.
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy - radius + 1, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
