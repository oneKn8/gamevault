import type { GridPosition } from './types';
import { FOOD, FOOD_HIGHLIGHT, FOOD_STEM, FOOD_LEAF, HUD_HEIGHT } from './constants';

export class FoodRenderer {
  pulseTime: number;

  constructor() {
    this.pulseTime = 0;
  }

  draw(ctx: CanvasRenderingContext2D, pos: GridPosition, cellSize: number): void {
    this.pulseTime += 0.04;

    const cx = pos.x * cellSize + cellSize / 2;
    const cy = pos.y * cellSize + cellSize / 2 + HUD_HEIGHT;
    const baseRadius = cellSize / 2 - 2;
    const pulse = 1 + Math.sin(this.pulseTime * 3) * 0.06;
    const radius = baseRadius * pulse;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Apple body
    ctx.fillStyle = FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Apple outline
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight spot (top-left, no gradient)
    ctx.fillStyle = FOOD_HIGHLIGHT;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Tiny white specular dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.35, cy - radius * 0.4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = FOOD_STEM;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 1);
    ctx.lineTo(cx + 1, cy - radius - 3);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = FOOD_LEAF;
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - radius - 1, 4, 2, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();

    // Leaf vein
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy - radius - 1);
    ctx.lineTo(cx + 5, cy - radius - 1.5);
    ctx.stroke();
  }
}
