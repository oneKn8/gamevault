import { Snake } from './Snake';
import { Direction } from './types';
import { SNAKE_HEAD, SNAKE_BODY, HUD_HEIGHT } from './constants';

/**
 * Handles drawing the snake with clean rounded body segments,
 * gradient coloring, and directional eyes on the head.
 */
export class SnakeRenderer {
  /**
   * Draw the full snake (body then head) onto the canvas.
   */
  draw(ctx: CanvasRenderingContext2D, snake: Snake, cellSize: number): void {
    const segments = snake.segments;
    const total = segments.length;

    // Draw body segments from tail to head (so head is on top).
    for (let i = total - 1; i >= 1; i--) {
      const seg = segments[i];
      const t = i / total; // 0 = head end, 1 = tail end
      const color = this.lerpColor(SNAKE_HEAD, SNAKE_BODY, t);

      const px = seg.x * cellSize;
      const py = seg.y * cellSize + HUD_HEIGHT;
      const inset = 1;
      const radius = 4;

      // Subtle shadow for depth.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.roundRect(ctx, px + inset + 1, py + inset + 1, cellSize - inset * 2, cellSize - inset * 2, radius);
      ctx.fill();

      // Body segment.
      ctx.fillStyle = color;
      this.roundRect(ctx, px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2, radius);
      ctx.fill();

      // Subtle highlight on top-left.
      const hlGrad = ctx.createLinearGradient(px, py, px + cellSize, py + cellSize);
      hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      hlGrad.addColorStop(0.5, 'transparent');
      ctx.fillStyle = hlGrad;
      this.roundRect(ctx, px + inset, py + inset, cellSize - inset * 2, cellSize - inset * 2, radius);
      ctx.fill();
    }

    // Draw head.
    const head = segments[0];
    const hx = head.x * cellSize;
    const hy = head.y * cellSize + HUD_HEIGHT;
    const centerX = hx + cellSize / 2;
    const centerY = hy + cellSize / 2;
    const headRadius = cellSize / 2 - 1;

    // Head shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 1, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head body.
    ctx.fillStyle = SNAKE_HEAD;
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head highlight.
    const headGrad = ctx.createRadialGradient(
      centerX - headRadius * 0.25, centerY - headRadius * 0.25, 0,
      centerX, centerY, headRadius,
    );
    headGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    headGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw eyes based on direction.
    this.drawEyes(ctx, centerX, centerY, headRadius, snake.direction);
  }

  /** Draw two small eyes on the head, offset by direction. */
  private drawEyes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    direction: Direction
  ): void {
    const eyeOffset = radius * 0.35;
    const eyeForward = radius * 0.3;
    const eyeRadius = 2.5;
    const pupilRadius = 1.2;

    let e1x: number, e1y: number, e2x: number, e2y: number;
    let px: number, py: number;

    switch (direction) {
      case Direction.UP:
        e1x = cx - eyeOffset;
        e1y = cy - eyeForward;
        e2x = cx + eyeOffset;
        e2y = cy - eyeForward;
        px = 0;
        py = -1;
        break;
      case Direction.DOWN:
        e1x = cx - eyeOffset;
        e1y = cy + eyeForward;
        e2x = cx + eyeOffset;
        e2y = cy + eyeForward;
        px = 0;
        py = 1;
        break;
      case Direction.LEFT:
        e1x = cx - eyeForward;
        e1y = cy - eyeOffset;
        e2x = cx - eyeForward;
        e2y = cy + eyeOffset;
        px = -1;
        py = 0;
        break;
      case Direction.RIGHT:
        e1x = cx + eyeForward;
        e1y = cy - eyeOffset;
        e2x = cx + eyeForward;
        e2y = cy + eyeOffset;
        px = 1;
        py = 0;
        break;
    }

    // White of the eyes.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e1x, e1y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x, e2y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pupils shifted in the movement direction.
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(e1x + px * 0.8, e1y + py * 0.8, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(e2x + px * 0.8, e2y + py * 0.8, pupilRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Linearly interpolate between two hex colors. */
  private lerpColor(a: string, b: string, t: number): string {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);

    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const blue = Math.round(ab + (bb - ab) * t);

    return `rgb(${r},${g},${blue})`;
  }

  /** Draw a rounded rectangle path and leave it ready for fill/stroke. */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
