import { GameLoop } from './engine/GameLoop';
import { EventBus } from './engine/EventBus';
import { InputManager } from './engine/InputManager';
import { Renderer } from './rendering/Renderer';
import { GameState } from './game/GameState';
import { GameEvent, GamePhase } from './types';
import { TILE_SIZE } from './constants';
import { LAYOUTS, LEVEL_ORDER } from './world/LayoutData';
import { Layout } from './world/Layout';
import { GameVault } from '@gamevault/game-sdk/client';

const HUD_HEIGHT = 52;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function sizeCanvas(layout: Layout): void {
  const gameW = layout.width * TILE_SIZE;
  const gameH = layout.height * TILE_SIZE + HUD_HEIGHT;

  // Scale to fit viewport while maintaining pixel-perfect rendering
  const maxW = window.innerWidth - 40;
  const maxH = window.innerHeight - 40;
  const scale = Math.min(maxW / gameW, maxH / gameH, 2.5);

  canvas.width = gameW;
  canvas.height = gameH;
  canvas.style.width = `${Math.floor(gameW * scale)}px`;
  canvas.style.height = `${Math.floor(gameH * scale)}px`;
}

// Initial sizing
const firstLayout = new Layout(LAYOUTS[LEVEL_ORDER[0]]);
sizeCanvas(firstLayout);

window.addEventListener('resize', () => {
  if (game.layout) sizeCanvas(game.layout);
});

const events = new EventBus();
const input = new InputManager();
const renderer = new Renderer();
const game = new GameState(events, input, renderer);
const loop = new GameLoop();

// VFX event wiring
events.on(GameEvent.DOT_EATEN, (payload) => {
  if (payload?.tile && game.layout) {
    const pos = game.layout.tileCenter(payload.tile);
    renderer.particles.emitDotEat(pos);
  }
});

events.on(GameEvent.CAPSULE_EATEN, () => {
  if (game.pacman) {
    renderer.particles.emitCapsule(game.pacman.pos);
    renderer.effects.flash('#4444ff', 0.35);
  }
});

events.on(GameEvent.GHOST_EATEN, (payload) => {
  if (payload?.ghost) {
    const ghost = payload.ghost;
    const color = ghost.name === 'blinky' ? '#ff4444'
      : ghost.name === 'pinky' ? '#ffccff'
      : ghost.name === 'inky' ? '#44ffff'
      : '#ffcc66';
    renderer.particles.emitGhostEat(ghost.pos, color, payload.points);
    renderer.effects.shake(8, 0.35);
  }
});

events.on(GameEvent.PACMAN_DIED, () => {
  if (game.pacman) {
    renderer.particles.emitDeath(game.pacman.pos);
    renderer.effects.shake(12, 0.6);
    renderer.effects.flash('#ff2222', 0.5);
  }
});

events.on(GameEvent.LEVEL_CLEAR, () => {
  renderer.effects.flash('#ffffff', 0.6);
});

events.on(GameEvent.GAME_OVER, () => {
  GameVault.submitScore(game.score.score, {
    level: game.level,
    highScore: game.score.highScore,
  });
});

let currentLevel = 0;

loop.onUpdate = (dt: number) => {
  game.update(dt);
  renderer.particles.update(dt);
  renderer.effects.update(dt);

  if (game.level !== currentLevel && game.layout) {
    currentLevel = game.level;
    sizeCanvas(game.layout);
    renderer.mazeRenderer.invalidate();
  }
};

loop.onRender = (_interp: number) => {
  if (!game.layout) return;
  const state = game.getRenderState();
  renderer.render(ctx, state as any);
};

// Initialize GameVault SDK (works in both embedded and standalone modes)
GameVault.init();

// Initial state - show title screen
game.phase = GamePhase.MENU;
loop.start();

// Draw a title screen before game starts
function drawTitleScreen(): void {
  const w = canvas.width;
  const h = canvas.height;

  // Background with subtle gradient
  ctx.fillStyle = '#020208';
  ctx.fillRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.5);
  bgGrad.addColorStop(0, 'rgba(20, 10, 60, 0.4)');
  bgGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title - NEON
  ctx.font = '900 36px "Orbitron", "Press Start 2P", sans-serif';
  ctx.fillStyle = '#ffe040';
  ctx.shadowColor = '#ffee55';
  ctx.shadowBlur = 35;
  ctx.fillText('NEON', w / 2, h * 0.28);
  ctx.fillText('NEON', w / 2, h * 0.28); // double for bloom

  // Title - PACMAN
  ctx.font = '900 28px "Orbitron", "Press Start 2P", sans-serif';
  ctx.fillStyle = '#3388ff';
  ctx.shadowColor = '#4499ff';
  ctx.shadowBlur = 25;
  ctx.fillText('PACMAN', w / 2, h * 0.28 + 42);
  ctx.fillText('PACMAN', w / 2, h * 0.28 + 42);

  // Decorative line
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

  // Press any key
  ctx.font = '600 13px "Orbitron", "Press Start 2P", sans-serif';
  ctx.fillStyle = '#4488ff';
  ctx.shadowColor = '#6699ff';
  ctx.shadowBlur = 12;
  const alpha = 0.4 + Math.sin(Date.now() / 500) * 0.6;
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillText('PRESS ANY KEY', w / 2, h * 0.52);
  ctx.globalAlpha = 1;

  // Controls hint
  ctx.font = '400 9px "Orbitron", sans-serif';
  ctx.fillStyle = '#3a4566';
  ctx.shadowBlur = 0;
  ctx.fillText('ARROW KEYS / WASD TO MOVE', w / 2, h * 0.70);
  ctx.fillText('EAT ALL DOTS TO WIN', w / 2, h * 0.70 + 20);

  // Vignette on title
  const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.65);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

// Override render for menu phase
const originalOnRender = loop.onRender;
loop.onRender = (interp: number) => {
  if (game.phase === GamePhase.MENU) {
    drawTitleScreen();
    requestAnimationFrame(() => {}); // keep animating title
    return;
  }
  originalOnRender(interp);
};

// Start game on first input
function onFirstInput(e: Event): void {
  if (e instanceof KeyboardEvent && (e.key === 'F5' || e.key === 'F12' || e.ctrlKey || e.altKey)) return;
  game.audio.init();
  game.startGame();
  currentLevel = game.level;
  if (game.layout) sizeCanvas(game.layout);
  document.removeEventListener('keydown', onFirstInput);
  document.removeEventListener('touchstart', onFirstInput);
  document.removeEventListener('click', onFirstInput);
}

document.addEventListener('keydown', onFirstInput);
document.addEventListener('touchstart', onFirstInput);
document.addEventListener('click', onFirstInput);
