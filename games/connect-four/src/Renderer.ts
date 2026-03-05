import { Board, ROWS, COLS } from './Board';

export const CELL_SIZE = 80;
export const PADDING = 40;
export const HEADER_HEIGHT = 60;
export const CANVAS_WIDTH = COLS * CELL_SIZE + PADDING * 2;
export const CANVAS_HEIGHT = ROWS * CELL_SIZE + PADDING * 2 + HEADER_HEIGHT;

const DISC_RADIUS = CELL_SIZE * 0.38;

// Modern color palette
const BOARD_BG = '#1a4b8c';
const PLAYER1_COLOR = '#e63946';
const PLAYER2_COLOR = '#f4d35e';
const EMPTY_HOLE = '#0d2b52';

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
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    // Draw status text
    this.drawStatus(ctx, w, status, currentPlayer);

    // Draw board background
    const boardX = PADDING;
    const boardY = PADDING + HEADER_HEIGHT;
    const boardW = COLS * CELL_SIZE;
    const boardH = ROWS * CELL_SIZE;

    // Board fill - classic blue
    ctx.fillStyle = BOARD_BG;
    ctx.beginPath();
    ctx.roundRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8, 12);
    ctx.fill();

    // Board border
    ctx.strokeStyle = '#12396e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boardX - 4, boardY - 4, boardW + 8, boardH + 8, 12);
    ctx.stroke();

    // Draw hover preview
    if (status === 'playing' && hoverCol >= 0 && hoverCol < COLS) {
      const previewX = boardX + hoverCol * CELL_SIZE + CELL_SIZE / 2;
      const previewY = boardY - CELL_SIZE * 0.35;
      const previewColor = currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
      ctx.globalAlpha = 0.5 + Math.sin(this.pulseTime * 3) * 0.15;
      ctx.fillStyle = previewColor;
      ctx.beginPath();
      ctx.arc(previewX, previewY, DISC_RADIUS * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Column highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(boardX + hoverCol * CELL_SIZE, boardY, CELL_SIZE, boardH);
    }

    // Draw empty holes first (cutout look)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board.grid[r][c] !== 0) continue;
        const cx = boardX + c * CELL_SIZE + CELL_SIZE / 2;
        const cy = boardY + r * CELL_SIZE + CELL_SIZE / 2;

        ctx.fillStyle = EMPTY_HOLE;
        ctx.beginPath();
        ctx.arc(cx, cy, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
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
        const color = cell === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;

        // Disc shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(cx + 2, cy + 2, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Disc body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        const innerGrad = ctx.createRadialGradient(
          cx - DISC_RADIUS * 0.25, cy - DISC_RADIUS * 0.25, 0,
          cx, cy, DISC_RADIUS,
        );
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        innerGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, DISC_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Winning disc ring animation
        if (isWinDisc) {
          const ringAlpha = 0.4 + Math.sin(this.pulseTime * 6) * 0.3;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.globalAlpha = ringAlpha;
          ctx.beginPath();
          ctx.arc(cx, cy, DISC_RADIUS + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  private drawStatus(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    status: GameStatus,
    currentPlayer: 1 | 2,
  ): void {
    const centerX = canvasWidth / 2;
    const y = PADDING + HEADER_HEIGHT / 2 - 4;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let text = '';
    let color = '#333333';
    let fontSize = 16;

    switch (status) {
      case 'menu':
        text = 'CONNECT FOUR';
        color = '#1a4b8c';
        fontSize = 22;
        break;
      case 'playing':
        text = currentPlayer === 1 ? 'YOUR TURN' : 'AI THINKING...';
        color = currentPlayer === 1 ? PLAYER1_COLOR : '#b8860b';
        break;
      case 'ai-thinking':
        text = 'AI THINKING...';
        color = '#b8860b';
        break;
      case 'player1-win':
        text = 'YOU WIN!';
        color = PLAYER1_COLOR;
        fontSize = 24;
        break;
      case 'player2-win':
        text = 'AI WINS!';
        color = '#b8860b';
        fontSize = 24;
        break;
      case 'draw':
        text = 'DRAW!';
        color = '#666666';
        fontSize = 24;
        break;
    }

    ctx.font = `700 ${fontSize}px "Orbitron", sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, centerX, y);
  }

  drawTitleScreen(ctx: CanvasRenderingContext2D): void {
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 36px "Orbitron", sans-serif';
    ctx.fillStyle = PLAYER1_COLOR;
    ctx.fillText('CONNECT', w / 2, h * 0.28);

    ctx.font = '900 32px "Orbitron", sans-serif';
    ctx.fillStyle = PLAYER2_COLOR;
    ctx.fillText('FOUR', w / 2, h * 0.28 + 46);

    // Decorative line
    ctx.save();
    const lineGrad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, 'rgba(26, 75, 140, 0.4)');
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
    ctx.font = '600 14px "Orbitron", sans-serif';
    ctx.fillStyle = '#1a4b8c';
    ctx.fillText('CLICK TO PLAY', w / 2, h * 0.54);
    ctx.restore();

    // Controls hint
    ctx.font = '400 9px "Orbitron", sans-serif';
    ctx.fillStyle = '#999999';
    ctx.fillText('CLICK A COLUMN TO DROP A DISC', w / 2, h * 0.70);
    ctx.fillText('CONNECT 4 IN A ROW TO WIN', w / 2, h * 0.70 + 20);
  }

  drawRestartHint(ctx: CanvasRenderingContext2D): void {
    const w = CANVAS_WIDTH;
    const y = CANVAS_HEIGHT - PADDING / 2 - 4;
    const alpha = 0.5 + Math.sin(Date.now() / 600) * 0.3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = '600 10px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666666';
    ctx.fillText('CLICK TO PLAY AGAIN', w / 2, y);
    ctx.restore();
  }
}
