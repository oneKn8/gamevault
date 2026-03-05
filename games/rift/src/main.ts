import { GameVault } from '@gamevault/game-sdk/client';
import { GameController } from './GameController';
import { Renderer } from './Renderer';
import { ParticleSystem } from './ParticleSystem';
import { InputManager } from './InputManager';
import { Camera } from './Camera';

GameVault.init();

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function sizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = VIEW_WIDTH * dpr;
  canvas.height = VIEW_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const maxW = window.innerWidth - 20;
  const maxH = window.innerHeight - 20;
  const scale = Math.min(maxW / VIEW_WIDTH, maxH / VIEW_HEIGHT, 2);
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;

  input.updateCanvasRect(scale);
}

const controller = new GameController();
const renderer = new Renderer();
const particles = new ParticleSystem();
const input = new InputManager(canvas);
const camera = new Camera(VIEW_WIDTH, VIEW_HEIGHT);

// Wire up particle events
controller.onPhaseShift = (x, y, fromDim) => {
  particles.emitPhaseShift(x, y, fromDim);
};
controller.onDamage = (x, y) => {
  particles.emitDamage(x, y);
};
controller.onCapture = (x, y, color) => {
  particles.emitCapture(x, y, color);
};
controller.onGameOver = (winnerId) => {
  const winner = controller.state.players.get(winnerId);
  if (winnerId === controller.localPlayerId) {
    GameVault.submitScore(Math.floor(controller.localPlayer?.score ?? 0), {
      result: 'victory',
    });
  }
};

sizeCanvas();
window.addEventListener('resize', sizeCanvas);

// Game loop
let lastTime = 0;
let elapsedTime = 0;

function gameLoop(time: number): void {
  const rawDt = lastTime === 0 ? 0.016 : (time - lastTime) / 1000;
  const dt = Math.min(rawDt, 0.1);
  lastTime = time;
  elapsedTime += dt;

  switch (controller.phase) {
    case 'title':
      if (input.isKeyDown(' ')) {
        controller.startGame();
        const lp = controller.localPlayer;
        if (lp) camera.snapTo(lp.position.x, lp.position.y);
      }
      renderer.drawTitle(ctx, VIEW_WIDTH, VIEW_HEIGHT, elapsedTime);
      break;

    case 'playing': {
      const lp = controller.localPlayer;
      if (lp) {
        camera.follow(lp.position.x, lp.position.y, dt);
        const localInput = input.getInput(lp.position.x, lp.position.y, camera.x, camera.y);
        controller.update(dt, localInput);
        particles.update(dt);
        renderer.drawGame(ctx, controller.state, lp, particles, camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT, elapsedTime);
      }
      break;
    }

    case 'gameover': {
      const lp = controller.localPlayer;
      if (lp) {
        particles.update(dt);
        renderer.drawGame(ctx, controller.state, lp, particles, camera.x, camera.y, VIEW_WIDTH, VIEW_HEIGHT, elapsedTime);
        const winner = controller.state.winner ? controller.state.players.get(controller.state.winner) : null;
        renderer.drawGameOver(
          ctx,
          winner?.username ?? 'Unknown',
          controller.state.winner === controller.localPlayerId,
          VIEW_WIDTH,
          VIEW_HEIGHT,
          elapsedTime,
        );
      }
      if (input.isKeyDown(' ')) {
        controller.reset();
        const lp2 = controller.localPlayer;
        if (lp2) camera.snapTo(lp2.position.x, lp2.position.y);
      }
      break;
    }
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
