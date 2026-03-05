import { GameVault } from '@gamevault/game-sdk/client';
import { colors } from '@gamevault/neon-theme/colors';
import { drawVignette } from '@gamevault/neon-theme/canvas/glow';
import { drawNeonText } from '@gamevault/neon-theme/canvas/text';
import { drawBoard, CANVAS_WIDTH, CANVAS_HEIGHT } from './Board';
import { drawPieces, updateFadeAnimations } from './PieceRenderer';
import { GameController, type GameResult } from './GameController';

// Initialize GameVault SDK
GameVault.init();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Scale to fit viewport
function sizeCanvas(): void {
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 80;
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT, 2);
  canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const controller = new GameController();

// Status bar height
const STATUS_HEIGHT = 40;
canvas.height = CANVAS_HEIGHT + STATUS_HEIGHT;

// Handle game over
controller.setOnGameOver((result: GameResult) => {
  let score = 10;
  if (result === 'checkmate-win') score = 100;
  else if (result === 'stalemate' || result === 'draw') score = 50;

  GameVault.submitScore(score, {
    result,
    moves: controller.chess.moveNumber(),
  });
});

// Game state: 'menu' or 'playing'
let phase: 'menu' | 'playing' = 'menu';

// Click handling
canvas.addEventListener('click', (e: MouseEvent) => {
  if (phase === 'menu') {
    phase = 'playing';
    controller.reset();
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  controller.handleClick(x, y);
});

// Keyboard: 'r' to restart
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (phase === 'menu') {
    if (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey) return;
    phase = 'playing';
    controller.reset();
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    controller.reset();
  }
});

// Game loop
let lastTime = 0;

function gameLoop(timestamp: number): void {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  updateFadeAnimations(dt);

  if (phase === 'menu') {
    drawTitleScreen();
  } else {
    drawGame();
  }

  requestAnimationFrame(gameLoop);
}

function drawGame(): void {
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  // Draw the board
  drawBoard(ctx, controller.selectedSquare, controller.legalMoves, controller.lastMove);

  // Draw pieces
  const board = controller.chess.board();
  drawPieces(ctx, board);

  // Check indicator: flash the king square
  if (controller.isCheck && controller.gameResult === 'playing') {
    const kingSquares = controller.chess.findPiece({ type: 'k', color: controller.currentTurn });
    if (kingSquares.length > 0) {
      const { col, row } = coordsFromSquareImport(kingSquares[0]);
      const kx = 28 + col * 64 + 32; // LABEL_PADDING + col * CELL_SIZE + CELL_SIZE/2
      const ky = 28 + row * 64 + 32;
      ctx.save();
      ctx.shadowColor = colors.neonRed;
      ctx.shadowBlur = 20 + Math.sin(Date.now() / 200) * 8;
      ctx.fillStyle = 'rgba(255, 26, 26, 0.2)';
      ctx.beginPath();
      ctx.arc(kx, ky, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Vignette
  drawVignette(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, 0.3);

  // Status bar
  const statusY = CANVAS_HEIGHT;
  ctx.fillStyle = '#030310';
  ctx.fillRect(0, statusY, w, STATUS_HEIGHT);

  const statusColor = controller.gameResult === 'checkmate-win' ? colors.neonGreen
    : controller.gameResult === 'checkmate-loss' ? colors.neonRed
    : controller.isCheck ? colors.neonYellow
    : colors.hudText;
  const statusGlow = controller.gameResult === 'checkmate-win' ? colors.neonGreenGlow
    : controller.gameResult === 'checkmate-loss' ? colors.neonRedGlow
    : controller.isCheck ? colors.neonYellowGlow
    : colors.neonBlueGlow;

  drawNeonText(ctx, controller.statusText, w / 2, statusY + STATUS_HEIGHT / 2, statusColor, statusGlow, 11, '"Press Start 2P"');

  // Restart hint when game is over
  if (controller.gameResult !== 'playing') {
    const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    drawNeonText(ctx, 'PRESS R TO RESTART', w / 2, statusY + STATUS_HEIGHT / 2 + 16, colors.hudDim, 'rgba(102,119,153,0.3)', 7, 'Orbitron');
    ctx.restore();
  }
}

function drawTitleScreen(): void {
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.5);
  bgGrad.addColorStop(0, 'rgba(20, 10, 60, 0.4)');
  bgGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Title - NEON
  drawNeonText(ctx, 'NEON', w / 2, h * 0.28, colors.neonYellow, colors.neonYellowGlow, 36, '"Orbitron"');

  // Title - CHESS
  drawNeonText(ctx, 'CHESS', w / 2, h * 0.28 + 42, colors.neonBlue, colors.neonBlueGlow, 28, '"Orbitron"');

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

  // Chess piece decoration
  drawNeonText(ctx, '\u265A \u2655', w / 2, h * 0.54, colors.neonCyan, colors.neonCyanGlow, 32, 'serif');

  // Press any key
  const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.6;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  drawNeonText(ctx, 'CLICK TO PLAY', w / 2, h * 0.68, colors.neonBlue, colors.neonBlueGlow, 13, '"Orbitron"');
  ctx.restore();

  // Controls hint
  drawNeonText(ctx, 'CLICK TO SELECT AND MOVE PIECES', w / 2, h * 0.80, colors.hudDim, 'rgba(102,119,153,0.3)', 8, 'Orbitron');
  drawNeonText(ctx, 'PRESS R TO RESTART', w / 2, h * 0.80 + 18, colors.hudDim, 'rgba(102,119,153,0.3)', 8, 'Orbitron');

  // Vignette
  drawVignette(ctx, w, h, 0.5);
}

// Helper to avoid circular import - inline coords calculation
function coordsFromSquareImport(sq: string): { col: number; row: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
  return { col: file, row: rank };
}

// Start the game loop
requestAnimationFrame(gameLoop);
