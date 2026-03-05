import { Layout } from '../world/Layout';
import {
  TILE_SIZE,
  WALL_COLOR,
  WALL_GLOW,
  WALL_INNER,
  WALL_FILL,
  DOT_COLOR,
  DOT_GLOW,
  CAPSULE_COLOR,
  CAPSULE_GLOW,
} from '../constants';

/**
 * Renders the maze background: walls with neon glow outlines, food dots
 * with gentle pulse, and power capsules with strong pulsing glow.
 *
 * Wall geometry is cached to an offscreen canvas since it never changes
 * during a level. Only food and capsules are redrawn per frame.
 */
export class MazeRenderer {
  /** Offscreen canvas caching the static wall artwork. */
  private wallCanvas: HTMLCanvasElement | null = null;

  /**
   * Invalidate the cached wall canvas. Call this whenever the layout
   * changes (e.g. new level loaded) so walls are re-rendered on the
   * next frame.
   */
  invalidate(): void {
    this.wallCanvas = null;
  }

  /**
   * Render the full maze: cached walls, then live food and capsules.
   */
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

  // ---------------------------------------------------------------------------
  // Wall rendering (drawn once, cached)
  // ---------------------------------------------------------------------------

  private renderWalls(ctx: CanvasRenderingContext2D, layout: Layout): void {
    const T = TILE_SIZE;

    // --- Pass 1: fill all wall interiors with subtle gradient ---
    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.isWall(col, row)) continue;
        ctx.fillStyle = WALL_FILL;
        ctx.fillRect(col * T, row * T, T, T);
      }
    }

    // --- Pass 2: soft outer glow (wide, low opacity) ---
    ctx.strokeStyle = WALL_GLOW;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = WALL_GLOW;
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.4;

    this.strokeWallEdges(ctx, layout, T);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // --- Pass 3: bright inner line ---
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = WALL_COLOR;
    ctx.shadowBlur = 10;

    this.strokeWallEdges(ctx, layout, T);

    // --- Pass 4: sharp bright edge highlight ---
    ctx.strokeStyle = WALL_INNER;
    ctx.lineWidth = 1;
    ctx.shadowColor = WALL_GLOW;
    ctx.shadowBlur = 4;
    ctx.globalAlpha = 0.6;

    this.strokeWallEdges(ctx, layout, T);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /**
   * Stroke all exposed wall edges and inner-corner arcs.
   * Extracted to avoid duplicating the iteration logic across passes.
   */
  private strokeWallEdges(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    T: number,
  ): void {
    const r = 5; // corner radius

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

        // Inner-corner arcs
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

  // ---------------------------------------------------------------------------
  // Food dots
  // ---------------------------------------------------------------------------

  private renderFood(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    time: number,
  ): void {
    const T = TILE_SIZE;
    const baseRadius = T * 0.1;
    const pulse = Math.sin(time * 3) * 0.3;
    const radius = baseRadius + pulse;

    // Soft glow layer
    ctx.fillStyle = DOT_GLOW;
    ctx.shadowColor = DOT_GLOW;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.3;

    ctx.beginPath();
    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.hasFood(col, row)) continue;
        const cx = col * T + T / 2;
        const cy = row * T + T / 2;
        ctx.moveTo(cx + radius + 2, cy);
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // Solid dot
    ctx.globalAlpha = 1;
    ctx.fillStyle = DOT_COLOR;
    ctx.shadowColor = DOT_COLOR;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    for (let col = 0; col < layout.width; col++) {
      for (let row = 0; row < layout.height; row++) {
        if (!layout.hasFood(col, row)) continue;
        const cx = col * T + T / 2;
        const cy = row * T + T / 2;
        ctx.moveTo(cx + radius, cy);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  // ---------------------------------------------------------------------------
  // Power capsules
  // ---------------------------------------------------------------------------

  private renderCapsules(
    ctx: CanvasRenderingContext2D,
    layout: Layout,
    time: number,
  ): void {
    if (layout.capsules.length === 0) return;

    const T = TILE_SIZE;
    const baseRadius = T * 0.3;
    const pulse = Math.sin(time * 4) * 2;
    const radius = baseRadius + pulse;

    // Outer glow halo (additive)
    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = CAPSULE_GLOW;
    ctx.shadowBlur = 22;
    ctx.fillStyle = CAPSULE_GLOW;
    ctx.globalAlpha = 0.25;

    for (const cap of layout.capsules) {
      const cx = cap.col * T + T / 2;
      const cy = cap.row * T + T / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = prevComposite;

    // Solid capsule with radial gradient
    for (const cap of layout.capsules) {
      const cx = cap.col * T + T / 2;
      const cy = cap.row * T + T / 2;

      const grad = ctx.createRadialGradient(cx - 1, cy - 2, 0, cx, cy, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ffddee');
      grad.addColorStop(1, CAPSULE_GLOW);

      ctx.shadowColor = CAPSULE_GLOW;
      ctx.shadowBlur = 16;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }
}
