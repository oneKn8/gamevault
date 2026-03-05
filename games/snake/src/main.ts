import { GameVault } from '@gamevault/game-sdk/client';
import { GameController } from './GameController';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { Direction } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL,
  HUD_HEIGHT,
  SNAKE_HEAD,
  FOOD,
} from './constants';

// Initialize GameVault SDK
GameVault.init();

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// DPR-aware canvas sizing with viewport fitting
function sizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_WIDTH * dpr;
  canvas.height = CANVAS_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT, 2);
  canvas.style.width = `${Math.floor(CANVAS_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_HEIGHT * scale)}px`;
}
sizeCanvas();
window.addEventListener('resize', sizeCanvas);

const controller = new GameController();
const renderer = new Renderer();
const particles = new ParticleSystem();

// Screen shake state
let shakeIntensity = 0;
let shakeDuration = 0;
let shakeTimer = 0;

function triggerShake(intensity: number, duration: number): void {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeTimer = 0;
}

// Wire up eat callback -> particle burst at food position
controller.onEatCallback = (pos) => {
  const px = pos.x * CELL + CELL / 2;
  const py = pos.y * CELL + CELL / 2 + HUD_HEIGHT;
  particles.emit(px, py, 15, FOOD, 100);
};

// Wire up die callback -> chain explosion + screen shake
controller.onDieCallback = (segments) => {
  particles.chainExplosion(segments);
  triggerShake(8, 0.5);
  GameVault.submitScore(controller.score, {
    length: segments.length,
  });
};

// Keyboard input: arrows + WASD for direction, SPACE to start/restart
document.addEventListener('keydown', (e) => {
  if (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey) return;

  // Start or restart
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (controller.phase === 'title' || controller.phase === 'gameover') {
      controller.reset();
      particles.particles.length = 0;
      shakeIntensity = 0;
      return;
    }
  }

  // Direction input (only while playing)
  if (controller.phase !== 'playing') return;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault();
      controller.queueDirection(Direction.UP);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      controller.queueDirection(Direction.DOWN);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      controller.queueDirection(Direction.LEFT);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      controller.queueDirection(Direction.RIGHT);
      break;
  }
});

// Emit trail particles behind the snake head while playing
let trailAccumulator = 0;

// Game loop
let lastTime = 0;
let elapsedTime = 0;

function gameLoop(time: number): void {
  const rawDt = lastTime === 0 ? 0.016 : (time - lastTime) / 1000;
  const dt = Math.min(rawDt, 0.1);
  lastTime = time;
  elapsedTime += dt;

  // Update
  if (controller.phase === 'playing') {
    controller.update(dt);
    particles.update(dt);

    // Trail particles behind the head
    trailAccumulator += dt;
    if (trailAccumulator >= 0.08) {
      trailAccumulator = 0;
      const head = controller.snake.getHead();
      const px = head.x * CELL + CELL / 2;
      const py = head.y * CELL + CELL / 2 + HUD_HEIGHT;
      particles.emitTrail(px, py, SNAKE_HEAD);
    }
  } else if (controller.phase === 'gameover') {
    particles.update(dt);
  }

  // Update screen shake
  if (shakeIntensity > 0) {
    shakeTimer += dt;
    if (shakeTimer >= shakeDuration) {
      shakeIntensity = 0;
    }
  }

  // Draw
  ctx.save();

  // Apply screen shake offset
  if (shakeIntensity > 0) {
    const progress = shakeTimer / shakeDuration;
    const currentIntensity = shakeIntensity * (1 - progress);
    const offsetX = (Math.random() - 0.5) * currentIntensity * 2;
    const offsetY = (Math.random() - 0.5) * currentIntensity * 2;
    ctx.translate(offsetX, offsetY);
  }

  switch (controller.phase) {
    case 'title':
      renderer.drawTitle(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, elapsedTime);
      break;
    case 'playing':
      renderer.drawGame(ctx, controller, particles, elapsedTime);
      break;
    case 'gameover':
      renderer.drawGame(ctx, controller, particles, elapsedTime);
      renderer.drawGameOver(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, controller.score, elapsedTime);
      break;
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
