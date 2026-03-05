import { GameVault } from '@gamevault/game-sdk';
import { createScene } from './SceneSetup';
import { CameraController } from './CameraController';
import { BoardRenderer } from './BoardRenderer';
import { TileRenderer } from './TileRenderer';
import { PieceRenderer } from './PieceRenderer';
import { ArrowRenderer } from './ArrowRenderer';
import { ParticleSystem } from './ParticleSystem';
import { HUD } from './HUD';
import { SettingsScreen } from './SettingsScreen';
import { InputManager } from './InputManager';
import { GameController } from './GameController';
import { Board } from './Board';
import { DEFAULT_SETTINGS } from './constants';
import type { PlayerID } from './types';

// Init SDK
GameVault.init();

// Canvas setup
const gameCanvas = document.getElementById('game') as HTMLCanvasElement;
const overlayCanvas = document.getElementById('overlay') as HTMLCanvasElement;

if (!gameCanvas || !overlayCanvas) {
  throw new Error('Canvas elements not found');
}

// Three.js scene
const { scene, camera, renderer } = createScene(gameCanvas);

// Create all systems
const cameraController = new CameraController(camera);
const boardRenderer = new BoardRenderer(scene);
const tileRenderer = new TileRenderer(scene);
const pieceRenderer = new PieceRenderer(scene);
const arrowRenderer = new ArrowRenderer(scene);
const particles = new ParticleSystem(scene);
const hud = new HUD(overlayCanvas);
const settingsScreen = new SettingsScreen(overlayCanvas);
const input = new InputManager(camera, gameCanvas);

// Game controller
const controller = new GameController(
  boardRenderer, tileRenderer, pieceRenderer, arrowRenderer,
  particles, cameraController, hud, settingsScreen, input,
);

controller.setOnScoreSubmit((score, meta) => {
  GameVault.submitScore(score, meta);
});

// Resize handler
function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  hud.resize(w, h, dpr);
  settingsScreen.resize(w, h, dpr);
}

window.addEventListener('resize', resize);
resize();

// Show settings initially
settingsScreen.show();
// Build initial board preview
const initialSettings = DEFAULT_SETTINGS;
cameraController.setTarget(initialSettings.gridSize);
boardRenderer.build(initialSettings.gridSize);

const previewBoard = new Board(initialSettings);
tileRenderer.buildGrid(initialSettings.gridSize, previewBoard.grid);

// Game loop
let lastTime = performance.now();

function gameLoop(now: number): void {
  const dt = Math.min(now - lastTime, 100);
  lastTime = now;

  const timeSec = now / 1000;

  // Update
  controller.update(dt);
  cameraController.update(dt, timeSec);
  tileRenderer.update(dt);
  pieceRenderer.update(timeSec);
  particles.update(dt / 1000);

  // Render 3D
  renderer.render(scene, camera);

  // Draw 2D overlay
  const board = controller.getBoard();
  const phase = controller.getPhase();

  if (settingsScreen.isVisible()) {
    settingsScreen.draw();
  }

  const territoryCounts = board ? board.getTerritoryCounts() : new Map<PlayerID, number>();
  const totalTiles = board ? board.getTotalPlayableTiles() : 0;
  const winTarget = board ? board.settings.winTarget : 60;
  const playerCount = board ? 1 + board.settings.aiCount : 3;

  hud.draw(
    phase,
    controller.getTurn(),
    territoryCounts,
    totalTiles,
    winTarget,
    controller.getWinner(),
    playerCount,
    controller.getPlanTimerRemaining(),
    controller.getSelectedPieceId(),
    controller.getUnplannedCount(),
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
