import type { Cell } from './types';
import { NUMBER_COLORS, TILE_HIDDEN, TILE_REVEALED, TILE_HOVER } from './constants';

export class TileRenderer {
  /**
   * Draw a single tile at the given position.
   * @param animScale - If provided, apply vertical scale transform for flip animation.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    x: number,
    y: number,
    size: number,
    hover: boolean,
    animScale: { scaleY: number; showRevealed: boolean } | null
  ): void {
    const gap = 2;
    const tileX = x + gap;
    const tileY = y + gap;
    const tileW = size - gap * 2;
    const tileH = size - gap * 2;

    ctx.save();

    // Apply flip animation transform
    if (animScale !== null) {
      const centerY = tileY + tileH / 2;
      ctx.translate(0, centerY);
      ctx.scale(1, animScale.scaleY);
      ctx.translate(0, -centerY);
    }

    const shouldShowRevealed = animScale ? animScale.showRevealed : cell.state === 'revealed';
    const isHidden = animScale ? !animScale.showRevealed : cell.state === 'hidden' || cell.state === 'flagged';

    if (isHidden) {
      this.drawHiddenTile(ctx, tileX, tileY, tileW, tileH, hover);
      // Draw flag on top if flagged (and not mid-flip to revealed)
      if (cell.state === 'flagged' && !animScale) {
        this.drawFlagIcon(ctx, tileX, tileY, tileW, tileH);
      }
    } else if (shouldShowRevealed) {
      this.drawRevealedTile(ctx, tileX, tileY, tileW, tileH);
      if (cell.mine) {
        this.drawMineIcon(ctx, tileX, tileY, tileW, tileH);
      } else if (cell.adjacentMines > 0) {
        this.drawNumber(ctx, tileX, tileY, tileW, tileH, cell.adjacentMines);
      }
    }

    ctx.restore();
  }

  /** Hidden tile with classic 3D bevel effect - raised look like Windows Minesweeper. */
  private drawHiddenTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    hover: boolean
  ): void {
    // Main face
    ctx.fillStyle = hover ? TILE_HOVER : TILE_HIDDEN;
    ctx.fillRect(x, y, w, h);

    // Top-left highlight (white edge for raised 3D look)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);

    // Bottom-right shadow (dark edge for raised 3D look)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x + w - 2, y, 2, h);
  }

  /** Revealed tile - flat sunken look with subtle border. */
  private drawRevealedTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    ctx.fillStyle = TILE_REVEALED;
    ctx.fillRect(x, y, w, h);

    // Subtle inset border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  /** Draw colored number for adjacent mine count. */
  private drawNumber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    num: number
  ): void {
    const color = NUMBER_COLORS[num - 1] || '#333333';
    const fontSize = Math.floor(h * 0.55);
    ctx.font = `700 ${fontSize}px 'Orbitron', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x + w / 2, y + h / 2 + 1);
  }

  /** Mine icon - dark circle with spikes. */
  drawMineIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) * 0.25;

    ctx.save();

    // Spikes
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    const spikeLen = radius * 1.6;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * radius * 0.5, cy + Math.sin(angle) * radius * 0.5);
      ctx.lineTo(cx + Math.cos(angle) * spikeLen, cy + Math.sin(angle) * spikeLen);
      ctx.stroke();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(cx - radius * 0.2, cy - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    ctx.restore();
  }

  /** Flag icon - red flag on a pole. */
  drawFlagIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const cx = x + w / 2;
    const top = y + h * 0.2;
    const bottom = y + h * 0.8;
    const poleX = cx - w * 0.05;

    ctx.save();

    // Pole
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(poleX, top);
    ctx.lineTo(poleX, bottom);
    ctx.stroke();

    // Base
    ctx.fillStyle = '#555555';
    ctx.fillRect(cx - w * 0.15, bottom - 2, w * 0.25, 3);

    // Flag triangle
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(poleX, top);
    ctx.lineTo(poleX + w * 0.35, top + h * 0.15);
    ctx.lineTo(poleX, top + h * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
