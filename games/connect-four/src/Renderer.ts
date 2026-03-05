import { Board, ROWS, COLS } from './Board';
import { colors } from '@gamevault/neon-theme/colors';
import { drawGlowCircle, drawGlowRect, drawVignette } from '@gamevault/neon-theme/canvas/glow';
import { drawNeonText } from '@gamevault/neon-theme/canvas/text';

export const CELL_SIZE = 80;
export const PADDING = 40;
export const HEADER_HEIGHT = 60;
export const CANVAS_WIDTH = COLS * CELL_SIZE + PADDING * 2;
export const CANVAS_HEIGHT = ROWS * CELL_SIZE + PADDING * 2 + HEADER_HEIGHT;

const DISC_RADIUS = CELL_SIZE * 0.38;

export type GameStatus = 'playing' | 'player1-win' | 'player2-win' | 'draw' | 'menu' | 'ai-thinking';

export class Renderer {
  private pulseTime = 0;

  update(dt: number): void {
    this.pulseTime += dt;
  }

  render(
    ctx: CanvasRenderingContext2D,
    board: Board,
    status: GameStatus,
    hoverCol: number,
    winPositions: number[][] | null,
    currentPlayer: 1 | 2,
  ): void {
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    // Clear background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.6);
    bgGrad.addColorStop(0, 'rgba(10, 15, 40, 0.4)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw status text
    this.drawStatus(ctx, w, status, currentPlayer);

    // Draw board background
    const boardX = PADDING;
    const boardY = PADDING + HEADER_HEIGHT;
    const boardW = COLS * CELL_SIZE;
    const boardH = ROWS * CELL_SIZE;

    // Board fill
    ctx.fillStyle = '#08081a';
    ctx.beginPath();
    ctx.roundRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8, 8);
    ctx.fill();

    // Board border glow
    drawGlowRect(ctx, boardX - 4, boardY - 4, boardW + 8, boardH + 8,
      colors.neonBlue, colors.neonBlueGlow, 2, 20, 8);

    // Draw hover preview
    if (status === 'playing' && hoverCol >= 0 && hoverCol < COLS) {
      const previewX = boardX + hoverCol * CELL_SIZE + CELL_SIZE / 2;
      const previewY = boardY - CELL_SIZE * 0.35;
      const previewColor = currentPlayer === 1 ? colors.neonCyan : colors.neonPink;
      ctx.globalAlpha = 0.4 + Math.sin(this.pulseTime * 4) * 0.15;
      drawGlowCircle(ctx, previewX, previewY, DISC_RADIUS * 0.8, previewColor, previewColor, DISC_RADIUS);
      ctx.globalAlpha = 1;

      // Column highlight
      ctx.fillStyle = `rgba(100, 150, 255, 0.04)`;
      ctx.fillRect(boardX + hoverCol * CELL_SIZE, boardY, CELL_SIZE, boardH);
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(40, 80, 180, 0.15)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      const x = boardX + c * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(x, boardY);
      ctx.lineTo(x, boardY + boardH);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      const y = boardY + r * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(boardX, y);
      ctx.lineTo(boardX + boardW, y);
      ctx.stroke();
    }

    // Draw discs
    const winSet = new Set<string>();
    if (winPositions) {
      for (const pos of winPositions) {
        winSet.add(`${pos[0]},${pos[1]}`);
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board.grid[r][c];
        if (cell === 0) continue;

        const cx = boardX + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = boardY + r * CELL_SIZE + CELL_SIZE / 2;

        const isWinDisc = winSet.has(`${r},${c}`);
        const pulseIntensity = isWinDisc
          ? DISC_RADIUS * 3 + Math.sin(this.pulseTime * 6) * DISC_RADIUS * 2
          : DISC_RADIUS * 2;

        if (cell === 1) {
          drawGlowCircle(ctx, cx, cy, DISC_RADIUS, colors.neonCyan, colors.neonCyanGlow, pulseIntensity);
          if (isWinDisc) {
            // Extra bloom for winning discs
            drawGlowCircle(ctx, cx, cy, DISC_RADIUS, colors.neonCyan, colors.neonCyanGlow, pulseIntensity);
          }
        } else {
          drawGlowCircle(ctx, cx, cy, DISC_RADIUS, colors.neonPink, colors.neonPinkGlow, pulseIntensity);
          if (isWinDisc) {
            drawGlowCircle(ctx, cx, cy, DISC_RADIUS, colors.neonPink, colors.neonPinkGlow, pulseIntensity);
          }
        }

        // Inner highlight
        const innerGrad = ctx.createRadialGradient(
          cx - DISC_RADIUS * 0.25, cy - DISC_RADIUS * 0.25, 0,
          cx, cy, DISC_RADIUS,
        );
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        innerGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw empty cell holes
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board.grid[r][c] !== 0) continue;
        const cx = boardX + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = boardY + r * CELL_SIZE + CELL_SIZE / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, DISC_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(30, 60, 120, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Vignette
    drawVignette(ctx, w, h, 0.35);
  }

  private drawStatus(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    status: GameStatus,
    currentPlayer: 1 | 2,
  ): void {
    const centerX = canvasWidth / 2;
    const y = PADDING + HEADER_HEIGHT / 2;

    switch (status) {
      case 'menu':
        drawNeonText(ctx, 'CONNECT FOUR', centerX, y - 4, colors.neonBlue, colors.neonBlueGlow, 22);
        break;
      case 'playing': {
        const turnColor = currentPlayer === 1 ? colors.neonCyan : colors.neonPink;
        const turnGlow = currentPlayer === 1 ? colors.neonCyanGlow : colors.neonPinkGlow;
        const label = currentPlayer === 1 ? 'YOUR TURN' : 'AI THINKING...';
        drawNeonText(ctx, label, centerX, y - 4, turnColor, turnGlow, 16);
        break;
      }
      case 'ai-thinking': {
        drawNeonText(ctx, 'AI THINKING...', centerX, y - 4, colors.neonPink, colors.neonPinkGlow, 16);
        break;
      }
      case 'player1-win':
        drawNeonText(ctx, 'YOU WIN!', centerX, y - 4, colors.neonCyan, colors.neonCyanGlow, 24);
        break;
      case 'player2-win':
        drawNeonText(ctx, 'AI WINS!', centerX, y - 4, colors.neonPink, colors.neonPinkGlow, 24);
        break;
      case 'draw':
        drawNeonText(ctx, 'DRAW!', centerX, y - 4, colors.neonYellow, colors.neonYellowGlow, 24);
        break;
    }
  }

  drawTitleScreen(ctx: CanvasRenderingContext2D): void {
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.5);
    bgGrad.addColorStop(0, 'rgba(20, 10, 60, 0.4)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Title
    drawNeonText(ctx, 'CONNECT', w / 2, h * 0.28, colors.neonCyan, colors.neonCyanGlow, 36, 'Orbitron');
    drawNeonText(ctx, 'FOUR', w / 2, h * 0.28 + 46, colors.neonPink, colors.neonPinkGlow, 32, 'Orbitron');

    // Decorative line
    ctx.save();
    ctx.shadowBlur = 0;
    const lineGrad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, 'rgba(60, 120, 255, 0.5)');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.44);
    ctx.lineTo(w * 0.8, h * 0.44);
    ctx.stroke();
    ctx.restore();

    // Press to play
    const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.6;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    drawNeonText(ctx, 'CLICK TO PLAY', w / 2, h * 0.54, colors.neonBlue, colors.neonBlueGlow, 14, 'Orbitron');
    ctx.restore();

    // Controls hint
    ctx.save();
    ctx.font = '400 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3a4566';
    ctx.fillText('CLICK A COLUMN TO DROP A DISC', w / 2, h * 0.70);
    ctx.fillText('CONNECT 4 IN A ROW TO WIN', w / 2, h * 0.70 + 20);
    ctx.restore();

    drawVignette(ctx, w, h, 0.5);
  }

  drawRestartHint(ctx: CanvasRenderingContext2D): void {
    const w = CANVAS_WIDTH;
    const y = CANVAS_HEIGHT - PADDING / 2 - 4;
    const alpha = 0.5 + Math.sin(Date.now() / 600) * 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    drawNeonText(ctx, 'CLICK TO PLAY AGAIN', w / 2, y, colors.neonBlue, colors.neonBlueGlow, 10, 'Orbitron');
    ctx.restore();
  }
}
