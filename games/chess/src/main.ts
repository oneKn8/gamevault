import { GameVault } from '@gamevault/game-sdk/client';
import { drawBoard, CANVAS_WIDTH, CANVAS_HEIGHT } from './Board';
import { drawPieces, updateFadeAnimations, loadPieceImages, triggerMoveAnimation } from './PieceRenderer';
import { GameController, type GameResult } from './GameController';

// Initialize GameVault SDK
GameVault.init();
loadPieceImages();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Status bar height
const STATUS_HEIGHT = 40;

// Scale to fit viewport with DPR support
function sizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = (CANVAS_HEIGHT + STATUS_HEIGHT) * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 80;
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / (CANVAS_HEIGHT + STATUS_HEIGHT), 2);
  canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor((CANVAS_HEIGHT + STATUS_HEIGHT) * scale)}px`;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const controller = new GameController();

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
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = (CANVAS_HEIGHT + STATUS_HEIGHT) / rect.height;
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

// Helper text drawing
function drawText(
  text: string,
  x: number,
  y: number,
  color: string,
  fontSize: number,
  font: string = 'Orbitron',
): void {
  ctx.font = `${fontSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

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
  const w = CANVAS_WIDTH;
  const h = CANVAS_HEIGHT + STATUS_HEIGHT;

  // Clear
  ctx.fillStyle = '#2b2117';
  ctx.fillRect(0, 0, w, h);

  // Draw the board
  drawBoard(ctx, controller.selectedSquare, controller.legalMoves, controller.lastMove);

  // Draw pieces
  const board = controller.chess.board();
  drawPieces(ctx, board);

  // Check indicator: red tint on king square
  if (controller.isCheck && controller.gameResult === 'playing') {
    const kingSquares = controller.chess.findPiece({ type: 'k', color: controller.currentTurn });
    if (kingSquares.length > 0) {
      const file = kingSquares[0].charCodeAt(0) - 97;
      const rank = 8 - parseInt(kingSquares[0][1], 10);
      const kx = 28 + file * 64;
      const ky = 28 + rank * 64;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.fillRect(kx, ky, 64, 64);
    }
  }

  // Status bar
  const statusY = CANVAS_HEIGHT;
  ctx.fillStyle = '#1a140e';
  ctx.fillRect(0, statusY, w, STATUS_HEIGHT);

  const statusColor = controller.gameResult === 'checkmate-win' ? '#4caf50'
    : controller.gameResult === 'checkmate-loss' ? '#e53935'
    : controller.isCheck ? '#ff9800'
    : '#d4c4a8';

  drawText(controller.statusText, w / 2, statusY + STATUS_HEIGHT / 2, statusColor, 11, '"Press Start 2P"');

  // Restart hint when game is over
  if (controller.gameResult !== 'playing') {
    const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.4;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    drawText('PRESS R TO RESTART', w / 2, statusY + STATUS_HEIGHT / 2 + 16, '#8b7355', 7);
    ctx.restore();
  }
}

function drawTitleScreen(): void {
  const w = CANVAS_WIDTH;
  const h = CANVAS_HEIGHT + STATUS_HEIGHT;

  // Background
  ctx.fillStyle = '#1a140e';
  ctx.fillRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.5);
  bgGrad.addColorStop(0, 'rgba(60, 45, 25, 0.3)');
  bgGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Title
  drawText('CHESS', w / 2, h * 0.30, '#d4c4a8', 36, '"Orbitron"');

  // Decorative line
  ctx.save();
  const lineGrad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(180, 140, 80, 0.5)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.40);
  ctx.lineTo(w * 0.8, h * 0.40);
  ctx.stroke();
  ctx.restore();

  // Chess piece decoration
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d4c4a8';
  ctx.fillText('\u265A \u2655', w / 2, h * 0.52);

  // Press any key
  const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.6;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  drawText('CLICK TO PLAY', w / 2, h * 0.66, '#b49860', 13, '"Orbitron"');
  ctx.restore();

  // Controls hint
  drawText('CLICK TO SELECT AND MOVE PIECES', w / 2, h * 0.78, '#6b5a42', 8);
  drawText('PRESS R TO RESTART', w / 2, h * 0.78 + 18, '#6b5a42', 8);
}

// Start the game loop
requestAnimationFrame(gameLoop);
