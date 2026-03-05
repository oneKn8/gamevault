import { Layout } from '../world/Layout';
import {
  TILE_SIZE,
  WALL_COLOR,
  WALL_FILL,
  DOT_COLOR,
  CAPSULE_COLOR,
  CAPSULE_GLOW,
} from '../constants';

export class MazeRenderer {
  private wallCanvas: HTMLCanvasElement | null = null;

  invalidate(): void {
    this.wallCanvas = null;
  }

  render(ctx: CanvasRenderingContext2D, layout: Layout, time: number): void {
    if (!this.wallCanvas) {
      this.wallCanvas = document.createElement('canvas');
      this.wallCanvas.width = layout.width * TILE_SIZE;
      this.wallCanvas.height = layout.height * TILE_SIZE;
      const wallCtx = this.wallCanvas.getContext('2d');
      if (wallCtx) {
        this.renderWalls(wallCtx, layout);
      }
    }

    ctx.drawImage(this.wallCanvas, 0, 0);
    this.renderFood(ctx, layout, time);
    this.renderCapsules(ctx, layout, time);
  }

  private renderWalls(ctx: CanvasRenderingContext2D, layout: Layout): void {
    const T = TILE_SIZE;

    // Fill wall interiors
    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.isWall(col, row)) continue;
        ctx.fillStyle = WALL_FILL;
        ctx.fillRect(col * T, row * T, T, T);
      }
    }

    // Wall edges
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Neon glow pass (wider blurred underneath)
    ctx.save();
    ctx.shadowColor = WALL_COLOR;
    ctx.shadowBlur = 12;
    this.strokeWallEdges(ctx, layout, T);
    ctx.restore();

    // Tight clean pass on top
    this.strokeWallEdges(ctx, layout, T);
  }

  private strokeWallEdges(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    T: number,
  ): void {
    const r = 5;

    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.isWall(col, row)) continue;

        const conn = layout.getWallConnections(col, row);
        const x = col * T;
        const y = row * T;

        if (!conn.n) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + T, y);
          ctx.stroke();
        }
        if (!conn.s) {
          ctx.beginPath();
          ctx.moveTo(x, y + T);
          ctx.lineTo(x + T, y + T);
          ctx.stroke();
        }
        if (!conn.w) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + T);
          ctx.stroke();
        }
        if (!conn.e) {
          ctx.beginPath();
          ctx.moveTo(x + T, y);
          ctx.lineTo(x + T, y + T);
          ctx.stroke();
        }

        // Corner arcs
        if (!conn.n && !conn.w) {
          ctx.beginPath();
          ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
          ctx.stroke();
        }
        if (!conn.n && !conn.e) {
          ctx.beginPath();
          ctx.arc(x + T - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
          ctx.stroke();
        }
        if (!conn.s && !conn.w) {
          ctx.beginPath();
          ctx.arc(x + r, y + T - r, r, Math.PI * 0.5, Math.PI);
          ctx.stroke();
        }
        if (!conn.s && !conn.e) {
          ctx.beginPath();
          ctx.arc(x + T - r, y + T - r, r, 0, Math.PI * 0.5);
          ctx.stroke();
        }
      }
    }
  }

  private renderFood(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    _time: number,
  ): void {
    const T = TILE_SIZE;
    const radius = T * 0.1;

    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.hasFood(col, row)) continue;
        const cx = col * T + T / 2;
        const cy = row * T + T / 2;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, DOT_COLOR);
        grad.addColorStop(1, DOT_COLOR);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderCapsules(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    time: number,
  ): void {
    if (layout.capsules.length === 0) return;

    const T = TILE_SIZE;
    const baseRadius = T * 0.3;
    // Pulsing blink effect
    const visible = Math.sin(time * 4) > -0.3;
    if (!visible) return;

    ctx.save();
    ctx.shadowColor = CAPSULE_GLOW;
    ctx.shadowBlur = 14;
    ctx.fillStyle = CAPSULE_COLOR;

    for (const cap of layout.capsules) {
      const cx = cap.col * T + T / 2;
      const cy = cap.row * T + T / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
