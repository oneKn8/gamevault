import { Direction, GhostMode, Vec2 } from '../types';
import {
  TILE_SIZE,
  GHOST_COLORS,
  FRIGHTENED_COLOR,
  FRIGHTENED_FLASH,
  SCARED_FLASH_START,
} from '../constants';

interface GhostLike {
  readonly pos: Vec2;
  readonly dir: Direction;
  readonly mode: GhostMode;
  readonly name: string;
  readonly frightenedTimer: number;
}

export class GhostRenderer {
  private static readonly HALF_SIZE = TILE_SIZE * 0.425;

  renderAll(
    ctx: CanvasRenderingContext2D,
    ghosts: GhostLike[],
    time: number,
  ): void {
    for (const ghost of ghosts) {
      this.renderGhost(ctx, ghost, time);
    }
  }

  private renderGhost(
    ctx: CanvasRenderingContext2D,
    ghost: GhostLike,
    time: number,
  ): void {
    const { x, y } = ghost.pos;
    const size = GhostRenderer.HALF_SIZE * 2;

    if (ghost.mode === GhostMode.EATEN) {
      this.drawEyes(ctx, x, y, size, ghost.dir);
      return;
    }

    if (ghost.mode === GhostMode.FRIGHTENED) {
      const flashing =
        ghost.frightenedTimer > 0 &&
        ghost.frightenedTimer <= SCARED_FLASH_START;
      let bodyColor = FRIGHTENED_COLOR;
      let bodyLight = '#4444ff';
      let glowColor = FRIGHTENED_COLOR;

      if (flashing && Math.floor(time * 6) % 2 === 0) {
        bodyColor = FRIGHTENED_FLASH;
        bodyLight = '#ffffff';
        glowColor = FRIGHTENED_FLASH;
      }

      this.drawBody(ctx, x, y, size, bodyColor, bodyLight, glowColor, time);
      this.drawFrightenedFace(ctx, x, y, size);
      return;
    }

    const colors = GHOST_COLORS[ghost.name] ?? { body: '#aaaaaa', bodyLight: '#cccccc', glow: '#cccccc' };
    this.drawBody(ctx, x, y, size, colors.body, colors.bodyLight, colors.glow, time);
    this.drawEyes(ctx, x, y, size, ghost.dir);
  }

  // ---------------------------------------------------------------------------
  // Body with gradient
  // ---------------------------------------------------------------------------

  private drawBody(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    colorLight: string,
    glowColor: string,
    time: number,
  ): void {
    const half = size / 2;
    const wobble = Math.sin(time * 8) * 1.5;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;

    // Build the ghost shape path
    const left = x - half;
    const right = x + half;
    const top = y - half;
    const bottom = y + half;

    ctx.beginPath();
    ctx.arc(x, top + half, half, Math.PI, 0);
    ctx.lineTo(right, bottom);

    const bumpWidth = size / 3;
    const bumpHeight = size * 0.15 + wobble;

    for (let i = 0; i < 3; i++) {
      const bx = right - bumpWidth * i;
      const bxNext = bx - bumpWidth;
      ctx.quadraticCurveTo(
        bx - bumpWidth / 2,
        bottom - bumpHeight,
        bxNext,
        bottom,
      );
    }

    ctx.lineTo(left, top + half);
    ctx.closePath();

    // Gradient fill for a polished 3D look
    const grad = ctx.createLinearGradient(x, top, x, bottom);
    grad.addColorStop(0, colorLight);
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle highlight on the dome
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.15;
    const highlight = ctx.createRadialGradient(
      x - half * 0.2, top + half * 0.3, 0,
      x, top + half * 0.5, half * 0.8,
    );
    highlight.addColorStop(0, '#ffffff');
    highlight.addColorStop(1, 'transparent');
    ctx.fillStyle = highlight;
    ctx.fillRect(left, top, size, size);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.shadowBlur = 0;
  }

  // ---------------------------------------------------------------------------
  // Eyes
  // ---------------------------------------------------------------------------

  private drawEyes(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    dir: Direction,
  ): void {
    const eyeOffsetX = size * 0.16;
    const eyeY = y - size * 0.08;
    const scleraRx = size * 0.13;
    const scleraRy = size * 0.16;
    const pupilR = size * 0.065;

    let px = 0;
    let py = 0;
    const shift = size * 0.06;

    switch (dir) {
      case Direction.UP: py = -shift; break;
      case Direction.DOWN: py = shift; break;
      case Direction.LEFT: px = -shift; break;
      case Direction.RIGHT: px = shift; break;
      default: break;
    }

    ctx.shadowBlur = 0;

    this.drawSingleEye(ctx, x - eyeOffsetX, eyeY, scleraRx, scleraRy, pupilR, px, py);
    this.drawSingleEye(ctx, x + eyeOffsetX, eyeY, scleraRx, scleraRy, pupilR, px, py);
  }

  private drawSingleEye(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    pupilR: number,
    pupilDx: number,
    pupilDy: number,
  ): void {
    // White sclera with slight glow
    ctx.fillStyle = '#f0f4ff';
    ctx.shadowColor = 'rgba(200, 220, 255, 0.3)';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();

    // Dark pupil
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0a22';
    ctx.beginPath();
    ctx.arc(cx + pupilDx, cy + pupilDy, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Tiny white highlight dot on pupil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(cx + pupilDx + pupilR * 0.3, cy + pupilDy - pupilR * 0.3, pupilR * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // Frightened face
  // ---------------------------------------------------------------------------

  private drawFrightenedFace(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void {
    const eyeR = size * 0.05;
    const eyeY = y - size * 0.1;
    const eyeSpacing = size * 0.15;

    ctx.fillStyle = '#eeeeff';
    ctx.beginPath();
    ctx.arc(x - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Wavy frown
    const mouthY = y + size * 0.12;
    const mouthHalf = size * 0.22;
    const wave = size * 0.06;

    ctx.strokeStyle = '#eeeeff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - mouthHalf, mouthY);

    const segW = mouthHalf / 2;
    ctx.lineTo(x - mouthHalf + segW, mouthY - wave);
    ctx.lineTo(x, mouthY);
    ctx.lineTo(x + segW, mouthY - wave);
    ctx.lineTo(x + mouthHalf, mouthY);
    ctx.stroke();
  }
}
