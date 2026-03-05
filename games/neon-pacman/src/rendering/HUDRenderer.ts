import { HUD_COLOR, HUD_LABEL, HUD_DIM, PACMAN_COLOR } from '../constants';

export class HUDRenderer {
  private static readonly PADDING_TOP = 14;
  private static readonly FONT_VALUE = '600 13px "Orbitron", "Press Start 2P", sans-serif';
  private static readonly FONT_LABEL = '400 9px "Orbitron", "Press Start 2P", sans-serif';
  private static readonly LIFE_ICON_RADIUS = 6;

  render(
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number,
    lives: number,
    level: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    const hudY = canvasHeight - HUDRenderer.PADDING_TOP;
    const margin = 14;

    ctx.save();
    ctx.textBaseline = 'bottom';

    // --- Score (left-aligned) ---
    ctx.font = HUDRenderer.FONT_LABEL;
    ctx.fillStyle = HUD_LABEL;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', margin, hudY - 13);

    ctx.font = HUDRenderer.FONT_VALUE;
    ctx.fillStyle = HUD_COLOR;
    ctx.fillText(`${score}`, margin, hudY);

    // --- High score (centered) ---
    ctx.font = HUDRenderer.FONT_LABEL;
    ctx.fillStyle = HUD_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH', canvasWidth / 2, hudY - 13);

    ctx.font = HUDRenderer.FONT_VALUE;
    ctx.fillStyle = HUD_DIM;
    ctx.fillText(`${highScore}`, canvasWidth / 2, hudY);

    // --- Level indicator (right-aligned) ---
    ctx.font = HUDRenderer.FONT_LABEL;
    ctx.fillStyle = HUD_LABEL;
    ctx.textAlign = 'right';
    ctx.fillText('LEVEL', canvasWidth - margin, hudY - 13);

    ctx.font = HUDRenderer.FONT_VALUE;
    ctx.fillStyle = HUD_COLOR;
    ctx.fillText(`${level}`, canvasWidth - margin, hudY);

    // --- Lives (small Pacman icons) ---
    const iconR = HUDRenderer.LIFE_ICON_RADIUS;
    const iconSpacing = iconR * 2.8;
    const totalWidth = lives * iconSpacing;
    const startX = canvasWidth * 0.28 - totalWidth / 2;
    const iconY = hudY - 6;

    ctx.fillStyle = PACMAN_COLOR;

    for (let i = 0; i < lives; i++) {
      const cx = startX + i * iconSpacing;
      const mouthAngle = Math.PI / 5;
      ctx.beginPath();
      ctx.moveTo(cx, iconY);
      ctx.arc(cx, iconY, iconR, Math.PI + mouthAngle, Math.PI - mouthAngle + Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
