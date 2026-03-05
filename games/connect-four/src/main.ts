import { GameVault } from '@gamevault/game-sdk/client';
import { Board } from './Board';
import { Renderer, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PADDING, HEADER_HEIGHT, type GameStatus } from './Renderer';
import { getBestMove } from './AI';

// Initialize GameVault SDK
GameVault.init();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Scale to fit viewport
function sizeCanvas(): void {
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT, 2);
  canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const board = new Board();
const renderer = new Renderer();

let gamePhase: 'menu' | 'playing' | 'gameover' = 'menu';
let currentPlayer: 1 | 2 = 1;
let status: GameStatus = 'menu';
let hoverCol = -1;
let winPositions: number[][] | null = null;
let aiThinking = false;
let lastTime = 0;

// Map mouse position to board column
function getColumnFromMouse(e: MouseEvent): number {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const boardX = PADDING;
  const col = Math.floor((mouseX - boardX) / CELL_SIZE);
  if (col < 0 || col >= 7) return -1;
  return col;
}

canvas.addEventListener('mousemove', (e) => {
  if (gamePhase !== 'playing' || currentPlayer !== 1) {
    hoverCol = -1;
    return;
  }
  hoverCol = getColumnFromMouse(e);
});

canvas.addEventListener('mouseleave', () => {
  hoverCol = -1;
});

canvas.addEventListener('click', (e) => {
  if (gamePhase === 'menu') {
    startGame();
    return;
  }

  if (gamePhase === 'gameover') {
    resetGame();
    return;
  }

  if (gamePhase === 'playing' && currentPlayer === 1 && !aiThinking) {
    const col = getColumnFromMouse(e);
    if (col < 0) return;
    playerMove(col);
  }
});

// Keyboard support for starting
document.addEventListener('keydown', (e) => {
  if (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey) return;
  if (gamePhase === 'menu') {
    startGame();
  } else if (gamePhase === 'gameover') {
    resetGame();
  }
});

function startGame(): void {
  board.reset();
  currentPlayer = 1;
  status = 'playing';
  winPositions = null;
  aiThinking = false;
  hoverCol = -1;
  gamePhase = 'playing';
}

function resetGame(): void {
  startGame();
}

function playerMove(col: number): void {
  const result = board.dropDisc(col, 1);
  if (!result) return;

  // Check for player win
  const win = board.checkWin(1);
  if (win) {
    winPositions = win;
    status = 'player1-win';
    gamePhase = 'gameover';
    GameVault.submitScore(100, { result: 'win' });
    return;
  }

  // Check for draw
  if (board.isFull()) {
    status = 'draw';
    gamePhase = 'gameover';
    GameVault.submitScore(50, { result: 'draw' });
    return;
  }

  // AI turn
  currentPlayer = 2;
  status = 'ai-thinking';
  aiThinking = true;

  // Delay AI move slightly so the player can see their disc placed
  setTimeout(() => {
    aiMove();
  }, 400);
}

function aiMove(): void {
  const col = getBestMove(board, 5);
  if (col < 0) return;

  board.dropDisc(col, 2);

  // Check for AI win
  const win = board.checkWin(2);
  if (win) {
    winPositions = win;
    status = 'player2-win';
    gamePhase = 'gameover';
    aiThinking = false;
    GameVault.submitScore(10, { result: 'loss' });
    return;
  }

  // Check for draw
  if (board.isFull()) {
    status = 'draw';
    gamePhase = 'gameover';
    aiThinking = false;
    GameVault.submitScore(50, { result: 'draw' });
    return;
  }

  currentPlayer = 1;
  status = 'playing';
  aiThinking = false;
}

// Game loop
function gameLoop(time: number): void {
  const dt = lastTime === 0 ? 0.016 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  renderer.update(dt);

  if (gamePhase === 'menu') {
    renderer.drawTitleScreen(ctx);
  } else {
    renderer.render(ctx, board, status, hoverCol, winPositions, currentPlayer);
    if (gamePhase === 'gameover') {
      renderer.drawRestartHint(ctx);
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
