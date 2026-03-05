import { GameVault } from '@gamevault/game-sdk/client';
import {
  Group,
} from 'three';
import type { BlockPosition, TetrominoType } from './types';
import { TETROMINO_DATA, BOARD_W, VISIBLE_HEIGHT } from './constants';
import { createScene } from './SceneSetup';
import { GameController } from './GameController';
import { InputManager } from './InputManager';
import type { InputAction } from './InputManager';
import { BoardRenderer } from './BoardRenderer';
import { GhostRenderer } from './GhostRenderer';
import { ParticleSystem3D } from './ParticleSystem3D';
import { createGridHelper } from './GridHelper';
import { createBlockMesh, recycleBlockMesh } from './BlockMesh';

// -- Initialize GameVault SDK --
GameVault.init();

// -- Canvas setup --
const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const overlayCanvas = document.getElementById('overlay') as HTMLCanvasElement;
const overlayCtx = overlayCanvas.getContext('2d')!;

// -- Three.js scene --
const { scene, camera, renderer } = createScene(gameCanvas);

// -- Game systems --
const controller = new GameController();
const input = new InputManager();
const boardRenderer = new BoardRenderer(scene);
const ghostRenderer = new GhostRenderer(scene);
const particles = new ParticleSystem3D();
particles.addToScene(scene);
createGridHelper(scene);

// -- Current piece meshes (reusable) --
let currentPieceMeshes: Group[] = [];

// -- Sizing --
function sizeCanvases(): void {
  const dpr = window.devicePixelRatio || 1;
  // Target aspect ratio for Tetris: roughly 10:20 board + side panels
  // We want the 3D canvas to fill the viewport nicely
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;

  // Use a width/height that maintains good aspect ratio
  const targetAspect = 0.6; // slightly taller than wide
  let w: number, h: number;

  if (maxW / maxH > targetAspect) {
    h = maxH;
    w = h * targetAspect;
  } else {
    w = maxW;
    h = w / targetAspect;
  }

  w = Math.floor(w);
  h = Math.floor(h);

  // Three.js renderer
  renderer.setSize(w, h);

  // Overlay canvas: match CSS size with DPR scaling
  overlayCanvas.style.width = `${w}px`;
  overlayCanvas.style.height = `${h}px`;
  overlayCanvas.width = w * dpr;
  overlayCanvas.height = h * dpr;
  overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Update camera aspect
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

sizeCanvases();
window.addEventListener('resize', sizeCanvases);

// -- Wire input actions to game controller --
input.onAction = (action: InputAction) => {
  if (controller.phase === 'title') {
    if (action === 'start' || action === 'hardDrop') {
      controller.start();
    }
    return;
  }

  if (controller.phase === 'gameover') {
    if (action === 'start' || action === 'hardDrop') {
      controller.start();
      clearCurrentPieceMeshes();
      ghostRenderer.clear();
      boardRenderer.clearAll();
    }
    return;
  }

  if (action === 'pause') {
    controller.togglePause();
    return;
  }

  if (controller.phase === 'paused') return;

  switch (action) {
    case 'moveLeft': controller.moveLeft(); break;
    case 'moveRight': controller.moveRight(); break;
    case 'softDrop': controller.softDrop(); break;
    case 'hardDrop': controller.hardDrop(); break;
    case 'rotateCW': controller.rotate(true); break;
    case 'rotateCCW': controller.rotate(false); break;
    case 'hold': controller.hold(); break;
  }
};

// -- Wire game controller callbacks --
controller.onLineClear = (rows: number[]) => {
  // Emit particles at cleared row positions
  const blockPositions: BlockPosition[] = [];
  for (const row of rows) {
    for (let col = 0; col < BOARD_W; col++) {
      blockPositions.push({ x: col, y: row });
    }
  }
  particles.emit(blockPositions, 0xffffff);

  // Animate line clear in the board renderer
  boardRenderer.animateLineClear(rows, controller.board, () => {
    controller.setAnimating(false);
    controller.spawnPiece();
  });
};

controller.onPieceLock = (blocks: BlockPosition[], color: number) => {
  // Brief flash effect via particles
  particles.emit(blocks, color);
  // Clear current piece meshes since it's now locked
  clearCurrentPieceMeshes();
};

// -- Current piece mesh management --
function clearCurrentPieceMeshes(): void {
  for (const mesh of currentPieceMeshes) {
    scene.remove(mesh);
    recycleBlockMesh(mesh);
  }
  currentPieceMeshes = [];
}

function updateCurrentPieceMeshes(): void {
  const piece = controller.currentPiece;
  if (!piece) {
    clearCurrentPieceMeshes();
    ghostRenderer.hide();
    return;
  }

  const blocks = piece.getBlocks();
  const color = piece.getColor();
  const emissive = piece.getEmissive();

  // Ensure we have the right number of meshes
  while (currentPieceMeshes.length < blocks.length) {
    const mesh = createBlockMesh(color, emissive);
    scene.add(mesh);
    currentPieceMeshes.push(mesh);
  }
  while (currentPieceMeshes.length > blocks.length) {
    const mesh = currentPieceMeshes.pop()!;
    scene.remove(mesh);
    recycleBlockMesh(mesh);
  }

  // Update positions
  for (let i = 0; i < blocks.length; i++) {
    currentPieceMeshes[i].position.set(blocks[i].x + 0.5, blocks[i].y + 0.5, 0);
    currentPieceMeshes[i].visible = blocks[i].y < VISIBLE_HEIGHT;
  }

  // Update ghost
  if (controller.ghostY !== piece.y) {
    const ghostBlocks = blocks.map(b => ({
      x: b.x,
      y: b.y - piece.y + controller.ghostY,
    }));
    ghostRenderer.update(ghostBlocks, color);
  } else {
    ghostRenderer.hide();
  }
}

// -- HUD Drawing (2D Overlay) --
function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function drawHUD(): void {
  const dpr = window.devicePixelRatio || 1;
  const w = overlayCanvas.width / dpr;
  const h = overlayCanvas.height / dpr;

  overlayCtx.clearRect(0, 0, w, h);

  if (controller.phase === 'title') {
    drawTitleScreen(w, h);
    return;
  }

  if (controller.phase === 'paused') {
    drawPauseScreen(w, h);
  }

  if (controller.phase === 'gameover') {
    drawGameOverScreen(w, h);
  }

  // Always draw HUD info during playing/paused/gameover
  if (controller.phase === 'playing' || controller.phase === 'paused' || controller.phase === 'gameover') {
    drawScorePanel(w, h);
    drawNextPanel(w, h);
    drawHoldPanel(w, h);
    drawControls(w, h);
  }
}

function drawTitleScreen(w: number, h: number): void {
  // Semi-transparent background
  overlayCtx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  overlayCtx.fillRect(0, 0, w, h);

  // Title with glow
  overlayCtx.save();
  overlayCtx.textAlign = 'center';
  overlayCtx.textBaseline = 'middle';

  const titleSize = Math.min(w * 0.12, 64);
  overlayCtx.font = `900 ${titleSize}px 'Orbitron', sans-serif`;

  // Glow layers
  overlayCtx.shadowColor = '#00ffff';
  overlayCtx.shadowBlur = 40;
  overlayCtx.fillStyle = '#00ffff';
  overlayCtx.fillText('TETRIS', w / 2, h * 0.35);
  overlayCtx.shadowBlur = 20;
  overlayCtx.fillText('TETRIS', w / 2, h * 0.35);
  overlayCtx.shadowBlur = 0;

  // Subtitle
  const subSize = Math.min(w * 0.035, 18);
  overlayCtx.font = `400 ${subSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#888888';
  overlayCtx.fillText('3D BLOCK PUZZLE', w / 2, h * 0.43);

  // Pulsing "Press SPACE" text
  const pulse = 0.5 + Math.sin(performance.now() / 500) * 0.5;
  overlayCtx.globalAlpha = 0.4 + pulse * 0.6;
  const promptSize = Math.min(w * 0.04, 20);
  overlayCtx.font = `600 ${promptSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#ffffff';
  overlayCtx.fillText('PRESS SPACE TO START', w / 2, h * 0.6);
  overlayCtx.globalAlpha = 1;

  // Controls hint
  const hintSize = Math.min(w * 0.025, 12);
  overlayCtx.font = `400 ${hintSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#555555';
  const controlY = h * 0.72;
  overlayCtx.fillText('ARROWS / WASD - Move & Rotate', w / 2, controlY);
  overlayCtx.fillText('SPACE - Hard Drop  |  C - Hold', w / 2, controlY + hintSize * 1.8);
  overlayCtx.fillText('Z - Rotate CCW  |  P - Pause', w / 2, controlY + hintSize * 3.6);

  overlayCtx.restore();
}

function drawPauseScreen(w: number, h: number): void {
  overlayCtx.save();
  overlayCtx.fillStyle = 'rgba(10, 10, 10, 0.6)';
  overlayCtx.fillRect(0, 0, w, h);

  overlayCtx.textAlign = 'center';
  overlayCtx.textBaseline = 'middle';

  const size = Math.min(w * 0.08, 48);
  overlayCtx.font = `700 ${size}px 'Orbitron', sans-serif`;
  overlayCtx.shadowColor = '#ffff00';
  overlayCtx.shadowBlur = 20;
  overlayCtx.fillStyle = '#ffff00';
  overlayCtx.fillText('PAUSED', w / 2, h / 2);
  overlayCtx.shadowBlur = 0;

  const subSize = Math.min(w * 0.035, 16);
  overlayCtx.font = `400 ${subSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#888888';
  overlayCtx.fillText('Press P to resume', w / 2, h / 2 + size);
  overlayCtx.restore();
}

function drawGameOverScreen(w: number, h: number): void {
  overlayCtx.save();
  overlayCtx.fillStyle = 'rgba(10, 10, 10, 0.7)';
  overlayCtx.fillRect(0, 0, w, h);

  overlayCtx.textAlign = 'center';
  overlayCtx.textBaseline = 'middle';

  const size = Math.min(w * 0.08, 48);
  overlayCtx.font = `700 ${size}px 'Orbitron', sans-serif`;
  overlayCtx.shadowColor = '#ff0000';
  overlayCtx.shadowBlur = 30;
  overlayCtx.fillStyle = '#ff3333';
  overlayCtx.fillText('GAME OVER', w / 2, h * 0.35);
  overlayCtx.shadowBlur = 0;

  const statSize = Math.min(w * 0.04, 20);
  overlayCtx.font = `600 ${statSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#cccccc';
  overlayCtx.fillText(`Score: ${controller.score}`, w / 2, h * 0.45);
  overlayCtx.fillText(`Level: ${controller.level}`, w / 2, h * 0.50);
  overlayCtx.fillText(`Lines: ${controller.lines}`, w / 2, h * 0.55);

  const pulse = 0.5 + Math.sin(performance.now() / 500) * 0.5;
  overlayCtx.globalAlpha = 0.4 + pulse * 0.6;
  const promptSize = Math.min(w * 0.035, 16);
  overlayCtx.font = `600 ${promptSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#ffffff';
  overlayCtx.fillText('PRESS SPACE TO RESTART', w / 2, h * 0.65);
  overlayCtx.globalAlpha = 1;

  overlayCtx.restore();
}

function drawScorePanel(w: number, h: number): void {
  overlayCtx.save();
  const panelX = w * 0.02;
  const panelY = h * 0.02;
  const fontSize = Math.min(w * 0.035, 16);

  overlayCtx.textAlign = 'left';
  overlayCtx.textBaseline = 'top';

  // Score
  overlayCtx.font = `400 ${fontSize * 0.7}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#666666';
  overlayCtx.fillText('SCORE', panelX, panelY);

  overlayCtx.font = `700 ${fontSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#ffffff';
  overlayCtx.fillText(controller.score.toLocaleString(), panelX, panelY + fontSize);

  // Level
  overlayCtx.font = `400 ${fontSize * 0.7}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#666666';
  overlayCtx.fillText('LEVEL', panelX, panelY + fontSize * 2.8);

  overlayCtx.font = `700 ${fontSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#00ffff';
  overlayCtx.fillText(String(controller.level), panelX, panelY + fontSize * 3.8);

  // Lines
  overlayCtx.font = `400 ${fontSize * 0.7}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#666666';
  overlayCtx.fillText('LINES', panelX, panelY + fontSize * 5.6);

  overlayCtx.font = `700 ${fontSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#aaaaaa';
  overlayCtx.fillText(String(controller.lines), panelX, panelY + fontSize * 6.6);

  overlayCtx.restore();
}

function drawMiniPiece(
  type: TetrominoType,
  cx: number,
  cy: number,
  blockSize: number,
): void {
  const data = TETROMINO_DATA[type];
  const blocks = data.blocks[0]; // rotation state 0
  const color = hexToCSS(data.color);

  // Calculate bounding box to center the piece
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const b of blocks) {
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x);
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y);
  }
  const pieceW = (maxX - minX + 1) * blockSize;
  const pieceH = (maxY - minY + 1) * blockSize;
  const offsetX = cx - pieceW / 2;
  const offsetY = cy - pieceH / 2;

  overlayCtx.fillStyle = color;
  overlayCtx.shadowColor = color;
  overlayCtx.shadowBlur = 6;

  for (const b of blocks) {
    const bx = offsetX + (b.x - minX) * blockSize;
    const by = offsetY + (b.y - minY) * blockSize;
    overlayCtx.fillRect(bx + 1, by + 1, blockSize - 2, blockSize - 2);
  }

  overlayCtx.shadowBlur = 0;
}

function drawNextPanel(w: number, h: number): void {
  overlayCtx.save();
  const panelX = w * 0.85;
  const panelY = h * 0.02;
  const fontSize = Math.min(w * 0.03, 14);
  const blockSize = Math.min(w * 0.03, 14);

  overlayCtx.textAlign = 'center';
  overlayCtx.textBaseline = 'top';
  overlayCtx.font = `400 ${fontSize * 0.8}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#666666';
  overlayCtx.fillText('NEXT', panelX, panelY);

  // Draw next 3 pieces
  for (let i = 0; i < controller.nextPieces.length && i < 3; i++) {
    const type = controller.nextPieces[i];
    const cy = panelY + fontSize * 2 + i * (blockSize * 3.5);
    drawMiniPiece(type, panelX, cy, blockSize);
  }

  overlayCtx.restore();
}

function drawHoldPanel(w: number, h: number): void {
  overlayCtx.save();
  const panelX = w * 0.85;
  const panelY = h * 0.55;
  const fontSize = Math.min(w * 0.03, 14);
  const blockSize = Math.min(w * 0.03, 14);

  overlayCtx.textAlign = 'center';
  overlayCtx.textBaseline = 'top';
  overlayCtx.font = `400 ${fontSize * 0.8}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#666666';
  overlayCtx.fillText('HOLD', panelX, panelY);

  if (controller.heldPiece) {
    const cy = panelY + fontSize * 2.5;
    overlayCtx.globalAlpha = controller.canHold ? 1.0 : 0.3;
    drawMiniPiece(controller.heldPiece, panelX, cy, blockSize);
    overlayCtx.globalAlpha = 1.0;
  }

  overlayCtx.restore();
}

function drawControls(w: number, h: number): void {
  overlayCtx.save();
  const fontSize = Math.min(w * 0.02, 10);
  overlayCtx.textAlign = 'left';
  overlayCtx.textBaseline = 'bottom';
  overlayCtx.font = `400 ${fontSize}px 'Orbitron', sans-serif`;
  overlayCtx.fillStyle = '#333333';

  const y = h - fontSize * 0.5;
  overlayCtx.fillText('Arrows/WASD  Space=Drop  C=Hold  Z=CCW  P=Pause', w * 0.02, y);
  overlayCtx.restore();
}

// -- Game Loop --
let lastTime = 0;
let scoreSubmitted = false;

function gameLoop(timestamp: number): void {
  const dt = lastTime === 0 ? 16 : Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;

  // Update systems
  input.update(dt);

  if (controller.phase === 'playing') {
    controller.update(dt);
    scoreSubmitted = false;
  }

  // Submit score exactly once on game over
  if (controller.phase === 'gameover' && !scoreSubmitted && controller.score > 0) {
    scoreSubmitted = true;
    GameVault.submitScore(controller.score, {
      level: controller.level,
      lines: controller.lines,
    });
  }

  particles.update(dt / 1000); // particles use seconds

  // Update 3D rendering
  updateCurrentPieceMeshes();
  boardRenderer.updateLocked(controller.board);

  // Render Three.js scene
  renderer.render(scene, camera);

  // Render 2D overlay
  drawHUD();

  requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
