import { Snake } from './Snake';
import { Direction } from './types';
import { SNAKE_HEAD, SNAKE_BODY, SNAKE_BELLY, HUD_HEIGHT } from './constants';

export class SnakeRenderer {
  draw(ctx: CanvasRenderingContext2D, snake: Snake, cellSize: number): void {
    const segments = snake.segments;
    const total = segments.length;

    // Draw body segments from tail to head (so head is on top).
    for (let i = total - 1; i >= 1; i--) {
      const seg = segments[i];
      const t = i / total;
      const color = this.lerpColor(SNAKE_HEAD, SNAKE_BODY, t);

      const px = seg.x * cellSize;
      const py = seg.y * cellSize + HUD_HEIGHT;
      const inset = 1;
      const radius = 5;
      const sw = cellSize - inset * 2;
      const sh = cellSize - inset * 2;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      this.roundRect(ctx, px + inset + 1, py + inset + 2, sw, sh, radius);
      ctx.fill();

      // Main body segment
      ctx.fillStyle = color;
      this.roundRect(ctx, px + inset, py + inset, sw, sh, radius);
      ctx.fill();

      // Scale pattern - lighter circle in center of each segment
      const scx = px + cellSize / 2;
      const scy = py + cellSize / 2;
      ctx.fillStyle = SNAKE_BELLY;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(scx, scy, cellSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Top edge highlight (1px lighter line)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.roundRect(ctx, px + inset, py + inset, sw, 2, radius);
      ctx.fill();

      // Bottom edge dark (1px darker line)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(px + inset + radius, py + inset + sh - 2, sw - radius * 2, 2);
    }

    // Draw head
    const head = segments[0];
    const hx = head.x * cellSize;
    const hy = head.y * cellSize + HUD_HEIGHT;
    const centerX = hx + cellSize / 2;
    const centerY = hy + cellSize / 2;
    const headRadius = cellSize / 2 - 1;

    // Head shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(centerX + 1, centerY + 2, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head body
    ctx.fillStyle = SNAKE_HEAD;
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head highlight spot (top-left area, no gradient)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3, headRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Head outline
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw eyes
    this.drawEyes(ctx, centerX, centerY, headRadius, snake.direction);
  }

  private drawEyes(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    direction: Direction
  ): void {
    const eyeOffset = radius * 0.4;
    const eyeForward = radius * 0.3;
    const eyeRadius = 3.5;
    const pupilRadius = 1.8;

    let e1x: number, e1y: number, e2x: number, e2y: number;
    let px: number, py: number;

    switch (direction) {
      case Direction.UP:
        e1x = cx - eyeOffset; e1y = cy - eyeForward;
        e2x = cx + eyeOffset; e2y = cy - eyeForward;
        px = 0; py = -1; break;
      case Direction.DOWN:
        e1x = cx - eyeOffset; e1y = cy + eyeForward;
        e2x = cx + eyeOffset; e2y = cy + eyeForward;
        px = 0; py = 1; break;
      case Direction.LEFT:
        e1x = cx - eyeForward; e1y = cy - eyeOffset;
        e2x = cx - eyeForward; e2y = cy + eyeOffset;
        px = -1; py = 0; break;
      case Direction.RIGHT:
        e1x = cx + eyeForward; e1y = cy - eyeOffset;
        e2x = cx + eyeForward; e2y = cy + eyeOffset;
        px = 1; py = 0; break;
    }

    // Eye whites with outline
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.8;
    for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Pupils
    ctx.fillStyle = '#1a1a1a';
    for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
      ctx.beginPath();
      ctx.arc(ex + px * 1.2, ey + py * 1.2, pupilRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny pupil highlights
    ctx.fillStyle = '#ffffff';
    for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
      ctx.beginPath();
      ctx.arc(ex + px * 0.5 - 0.5, ey + py * 0.5 - 0.5, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

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

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
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
