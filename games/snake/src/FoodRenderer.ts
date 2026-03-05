import type { GridPosition } from './types';
import { FOOD, HUD_HEIGHT } from './constants';

/** Sparkle orbiting around the food item. */
interface Sparkle {
  angle: number;
  dist: number;
}

/**
 * Renders the food item with a pulsing radial gradient,
 * orbiting sparkle particles, and neon glow.
 */
export class FoodRenderer {
  /** Accumulates elapsed time for pulsing animation. */
  pulseTime: number;

  /** Orbiting sparkle dots. */
  sparkles: Sparkle[];

  constructor() {
    this.pulseTime = 0;
    this.sparkles = [];
    for (let i = 0; i < 5; i++) {
      this.sparkles.push({
        angle: (Math.PI * 2 * i) / 5,
        dist: 10 + Math.random() * 4,
      });
    }
  }

  /**
   * Draw the food item at the given grid position.
   * @param ctx - Canvas 2D rendering context.
   * @param pos - Grid position of the food.
   * @param cellSize - Size of each grid cell in pixels.
   */
  draw(ctx: CanvasRenderingContext2D, pos: GridPosition, cellSize: number): void {
    this.pulseTime += 0.04;

    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2 + HUD_HEIGHT;
    const baseRadius = cellSize / 2 - 3;
    const pulse = 1 + Math.sin(this.pulseTime * 3) * 0.15;
    const radius = baseRadius * pulse;

    // Radial gradient fill.
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, FOOD);
    grad.addColorStop(1, '#cc1155');

    ctx.save();
    ctx.shadowColor = FOOD;
    ctx.shadowBlur = 15 + Math.sin(this.pulseTime * 3) * 5;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Orbiting sparkles.
    for (const sparkle of this.sparkles) {
      sparkle.angle += 0.025;
      const sx = cx + Math.cos(sparkle.angle) * sparkle.dist * pulse;
      const sy = cy + Math.sin(sparkle.angle) * sparkle.dist * pulse;
      const sparkleAlpha = 0.5 + Math.sin(this.pulseTime * 4 + sparkle.angle) * 0.5;

      ctx.save();
      ctx.globalAlpha = sparkleAlpha;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
