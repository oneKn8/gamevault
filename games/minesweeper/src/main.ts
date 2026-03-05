import { GameVault } from '@gamevault/game-sdk/client';
import { GameController } from './GameController';
import { Renderer } from './Renderer';
import { DIFFICULTIES, HEADER_HEIGHT, PADDING } from './constants';

// Initialize GameVault SDK
GameVault.init();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const controller = new GameController();
const renderer = new Renderer();

let canvasLogicalW = 0;
let canvasLogicalH = 0;

/** Size the canvas to fit the current game state. */
function sizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;

  let logicalW: number;
  let logicalH: number;

  if (controller.phase === 'menu') {
    // Use intermediate size as default for menu
    const defaultConfig = DIFFICULTIES.intermediate;
    const size = renderer.getCanvasSize(defaultConfig);
    logicalW = size.width;
    logicalH = size.height;
  } else {
    const config = controller.getConfig();
    if (config) {
      const size = renderer.getCanvasSize(config);
      logicalW = size.width;
      logicalH = size.height;
    } else {
      logicalW = 512;
      logicalH = 572;
    }
  }

  canvasLogicalW = logicalW;
  canvasLogicalH = logicalH;

  canvas.width = logicalW * dpr;
  canvas.height = logicalH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Viewport fitting
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const scale = Math.min(maxW / logicalW, maxH / logicalH, 2);
  canvas.style.width = `${Math.floor(logicalW * scale)}px`;
  canvas.style.height = `${Math.floor(logicalH * scale)}px`;
}

sizeCanvas();
window.addEventListener('resize', sizeCanvas);

/** Convert a mouse event to logical canvas coordinates. */
function getMousePos(e: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvasLogicalW / rect.width;
  const scaleY = canvasLogicalH / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

// -- Mouse Events --

canvas.addEventListener('mousemove', (e) => {
  if (controller.phase !== 'playing') {
    renderer.hoverCell = null;
    return;
  }
  const config = controller.getConfig();
  if (!config) return;

  const pos = getMousePos(e);
  renderer.hoverCell = renderer.getClickedCell(pos.x, pos.y, config);
});

canvas.addEventListener('mouseleave', () => {
  renderer.hoverCell = null;
});

canvas.addEventListener('mousedown', (e) => {
  // Right click for flagging
  if (e.button === 2) {
    e.preventDefault();
    if (controller.phase !== 'playing') return;
    const config = controller.getConfig();
    if (!config) return;

    const pos = getMousePos(e);
    const cell = renderer.getClickedCell(pos.x, pos.y, config);
    if (cell) {
      controller.handleRightClick(cell.row, cell.col);
    }
    return;
  }

  // Left click
  if (e.button !== 0) return;
  const pos = getMousePos(e);

  if (controller.phase === 'menu') {
    const diff = renderer.getDifficultyAtPoint(pos.x, pos.y, canvasLogicalW, canvasLogicalH);
    if (diff) {
      controller.selectDifficulty(diff);
      sizeCanvas();
    }
    return;
  }

  if (controller.phase === 'won' || controller.phase === 'lost') {
    controller.reset();
    sizeCanvas();
    return;
  }

  if (controller.phase === 'playing') {
    const config = controller.getConfig();
    if (!config) return;

    const cell = renderer.getClickedCell(pos.x, pos.y, config);
    if (!cell) return;

    const result = controller.handleClick(cell.row, cell.col);

    if (result === 'mine') {
      // Emit explosion particles at the mine location
      const gridX = PADDING + cell.col * config.cellSize + config.cellSize / 2;
      const gridY = HEADER_HEIGHT + PADDING + cell.row * config.cellSize + config.cellSize / 2;
      renderer.particleSystem.emitExplosion(gridX, gridY, 40, '#ff4444');
      renderer.particleSystem.emitExplosion(gridX, gridY, 20, '#FF9800');
    } else if (result && result.length > 0) {
      // Cascading tile flip animations
      renderer.tileAnimator.addReveal(result, 0.03);

      // Check for win - emit confetti
      if (controller.phase === 'won') {
        const centerX = canvasLogicalW / 2;
        const centerY = canvasLogicalH / 2;
        renderer.particleSystem.emitConfetti(centerX, centerY - 40, 60);
        renderer.particleSystem.emitConfetti(centerX - 80, centerY, 40);
        renderer.particleSystem.emitConfetti(centerX + 80, centerY, 40);
        GameVault.submitScore(controller.score, {
          difficulty: controller.difficulty,
          time: controller.timer.getElapsed(),
        });
      }
    }
  }
});

// Prevent right-click context menu on canvas
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey) return;

  if (e.key === 'r' || e.key === 'R') {
    if (controller.phase === 'won' || controller.phase === 'lost') {
      controller.reset();
      sizeCanvas();
    }
    return;
  }

  if (e.key === ' ') {
    e.preventDefault();
    if (controller.phase === 'menu') {
      // Space starts beginner by default
      controller.selectDifficulty('beginner');
      sizeCanvas();
    } else if (controller.phase === 'won' || controller.phase === 'lost') {
      controller.reset();
      sizeCanvas();
    }
  }
});

// -- Game Loop --

let lastTime = 0;

function gameLoop(time: number): void {
  const dt = lastTime === 0 ? 0.016 : Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // Update systems
  renderer.tileAnimator.update(dt);
  renderer.particleSystem.update(dt);

  // Draw based on phase
  if (controller.phase === 'menu') {
    renderer.drawMenu(ctx, canvasLogicalW, canvasLogicalH, time / 1000);
  } else {
    renderer.drawGame(ctx, controller, canvasLogicalW, canvasLogicalH, time / 1000);

    if (controller.phase === 'won' || controller.phase === 'lost') {
      renderer.drawGameOver(
        ctx,
        canvasLogicalW,
        canvasLogicalH,
        controller.phase === 'won',
        controller.score,
        time / 1000
      );
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
