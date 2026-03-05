import type { Cell } from './types';
import {
  NUMBER_COLORS,
  TILE_HIDDEN,
  TILE_REVEALED,
  TILE_HOVER,
  TILE_MINE_HIT,
  BEVEL_LIGHT,
  BEVEL_MID,
  BEVEL_DARK,
  BEVEL_DARKEST,
} from './constants';

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
    animScale: { scaleY: number; showRevealed: boolean } | null,
    isHitMine?: boolean
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
      if (cell.state === 'flagged' && !animScale) {
        this.drawFlagIcon(ctx, tileX, tileY, tileW, tileH);
      }
    } else if (shouldShowRevealed) {
      this.drawRevealedTile(ctx, tileX, tileY, tileW, tileH, isHitMine && cell.mine ? true : false);
      if (cell.mine) {
        this.drawMineIcon(ctx, tileX, tileY, tileW, tileH, isHitMine ? true : false);
      } else if (cell.adjacentMines > 0) {
        this.drawNumber(ctx, tileX, tileY, tileW, tileH, cell.adjacentMines);
      }
    }

    ctx.restore();
  }

  /**
   * Raised hidden tile with deep classic Windows 3D bevel.
   * Uses two-layer bevel: outer bright/dark + inner mid edges.
   * NO gradients - all solid fills.
   */
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

    // Outer bevel - top and left bright edge (2px)
    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(x, y, w, 2);       // top
    ctx.fillRect(x, y, 2, h);       // left

    // Outer bevel - bottom and right dark edge (2px)
    ctx.fillStyle = BEVEL_DARKEST;
    ctx.fillRect(x, y + h - 2, w, 2);   // bottom
    ctx.fillRect(x + w - 2, y, 2, h);   // right

    // Inner bevel - top and left mid-light (1px, inset by 2)
    ctx.fillStyle = BEVEL_MID;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);   // top inner
    ctx.fillRect(x + 2, y + 2, 1, h - 4);   // left inner

    // Inner bevel - bottom and right dark (1px, inset by 2)
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);   // bottom inner
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);   // right inner
  }

  /**
   * Revealed tile - flat sunken look with inset border lines.
   * The red highlight is used for the mine that was clicked.
   */
  private drawRevealedTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isHitMine: boolean
  ): void {
    ctx.fillStyle = isHitMine ? TILE_MINE_HIT : TILE_REVEALED;
    ctx.fillRect(x, y, w, h);

    // Sunken inset border: dark top-left, light bottom-right
    ctx.fillStyle = BEVEL_DARK;
    ctx.fillRect(x, y, w, 1);     // top dark line
    ctx.fillRect(x, y, 1, h);     // left dark line

    ctx.fillStyle = BEVEL_LIGHT;
    ctx.fillRect(x, y + h - 1, w, 1);   // bottom bright line
    ctx.fillRect(x + w - 1, y, 1, h);   // right bright line
  }

  /** Draw colored number for adjacent mine count. Bold, classic font. */
  private drawNumber(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    num: number
  ): void {
    const color = NUMBER_COLORS[num - 1] || '#333333';
    const fontSize = Math.floor(h * 0.6);
    ctx.font = `900 ${fontSize}px 'Orbitron', sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x + w / 2, y + h / 2 + 1);
  }

  /**
   * Mine icon drawn with layered solid fills only.
   * Spoked circle: 8 rectangular spikes + round body + fuse on top + white glint.
   * NO shadowBlur, NO gradients.
   */
  drawMineIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isHit?: boolean
  ): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.26;

    ctx.save();

    // Draw 8 spikes as thick lines - cardinal + diagonal
    const spikeColor = '#1a1a1a';
    ctx.strokeStyle = spikeColor;
    ctx.lineCap = 'round';

    // Cardinal spikes (N/S/E/W) - longer
    const cardLen = r * 1.55;
    const diagLen = r * 1.35;
    ctx.lineWidth = Math.max(2, r * 0.38);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const len = i % 1 === 0 ? cardLen : diagLen;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Diagonal spikes - shorter
    ctx.lineWidth = Math.max(1.5, r * 0.28);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r * 0.6, cy + Math.sin(angle) * r * 0.6);
      ctx.lineTo(cx + Math.cos(angle) * diagLen, cy + Math.sin(angle) * diagLen);
      ctx.stroke();
    }

    // Main body - dark circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // Fuse - short diagonal line from top
    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = Math.max(1.5, r * 0.25);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.2, cy - r * 0.85);
    ctx.lineTo(cx + r * 0.55, cy - r * 1.45);
    ctx.stroke();

    // White glint - top-left, solid ellipse (no gradient)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.28, r * 0.22, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Second smaller glint dot
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.42, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Flag icon - classic Minesweeper flag: red rectangular flag on black pole with base.
   * Rich detail: pole shadow, flag outline, base bevel. NO gradients.
   */
  drawFlagIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const poleX = x + w * 0.42;
    const poleTop = y + h * 0.16;
    const poleBot = y + h * 0.80;
    const poleW = Math.max(2, w * 0.07);

    ctx.save();

    // Pole shadow (offset 1px right+down, solid dark)
    ctx.fillStyle = '#555555';
    ctx.fillRect(poleX + 1, poleTop + 1, poleW, poleBot - poleTop);

    // Pole - solid dark color
    ctx.fillStyle = '#222222';
    ctx.fillRect(poleX, poleTop, poleW, poleBot - poleTop);

    // Flag body - solid red rectangle (classic look, not triangle)
    const flagLeft = poleX + poleW;
    const flagTop = poleTop;
    const flagW = w * 0.40;
    const flagH = h * 0.32;

    // Flag shadow (1px offset)
    ctx.fillStyle = '#aa1111';
    ctx.fillRect(flagLeft + 1, flagTop + 1, flagW, flagH);

    // Flag face - bright red
    ctx.fillStyle = '#e53935';
    ctx.fillRect(flagLeft, flagTop, flagW, flagH);

    // Flag dark outline top + right for depth
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(flagLeft, flagTop, flagW, 1);         // top edge
    ctx.fillRect(flagLeft + flagW - 1, flagTop, 1, flagH);  // right edge

    // Flag bright highlight bottom-left corner
    ctx.fillStyle = '#ef9a9a';
    ctx.fillRect(flagLeft, flagTop + flagH - 2, 3, 1);
    ctx.fillRect(flagLeft, flagTop + 1, 1, flagH - 2);

    // Base: horizontal bar at bottom with bevel
    const baseW = w * 0.54;
    const baseH = Math.max(3, h * 0.09);
    const baseX = x + (w - baseW) / 2;
    const baseY = poleBot - baseH + 1;

    // Base shadow
    ctx.fillStyle = '#555555';
    ctx.fillRect(baseX + 1, baseY + 1, baseW, baseH);

    // Base body
    ctx.fillStyle = '#222222';
    ctx.fillRect(baseX, baseY, baseW, baseH);

    // Base top highlight
    ctx.fillStyle = '#666666';
    ctx.fillRect(baseX, baseY, baseW, 1);

    ctx.restore();
  }
}
