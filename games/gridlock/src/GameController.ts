import type { GameSettings, GamePhase, PlayerID, PlannedMove } from './types';
import { Board } from './Board';
import { AI } from './AI';
import { BoardRenderer } from './BoardRenderer';
import { TileRenderer } from './TileRenderer';
import { PieceRenderer } from './PieceRenderer';
import { ArrowRenderer } from './ArrowRenderer';
import { ParticleSystem } from './ParticleSystem';
import { CameraController } from './CameraController';
import { AnimationQueue, delay } from './AnimationQueue';
import { HUD } from './HUD';
import { SettingsScreen } from './SettingsScreen';
import { InputManager } from './InputManager';
import {
  PLAYER_COLORS, TILE_GAP, REVEAL_PAUSE_DURATION,
  PIECE_MOVE_DURATION, PIECE_DEATH_DURATION, TILE_CAPTURE_DURATION,
} from './constants';

export class GameController {
  private board: Board | null = null;
  private ai = new AI();
  private phase: GamePhase = 'settings';
  private turn = 1;
  private winner: PlayerID | null = null;

  // Renderers
  private boardRenderer: BoardRenderer;
  private tileRenderer: TileRenderer;
  private pieceRenderer: PieceRenderer;
  private arrowRenderer: ArrowRenderer;
  private particles: ParticleSystem;
  private camera: CameraController;
  private hud: HUD;
  private settingsScreen: SettingsScreen;
  private input: InputManager;
  private animQueue = new AnimationQueue();

  // Planning state
  private selectedPieceId: number | null = null;
  private settings: GameSettings | null = null;

  // Plan timer
  private planTimerRemaining: number | null = null;
  private planTimerActive = false;

  // Score submission
  private scoreSubmitted = false;
  private onScoreSubmit: ((score: number, meta: Record<string, unknown>) => void) | null = null;

  constructor(
    boardRenderer: BoardRenderer,
    tileRenderer: TileRenderer,
    pieceRenderer: PieceRenderer,
    arrowRenderer: ArrowRenderer,
    particles: ParticleSystem,
    camera: CameraController,
    hud: HUD,
    settingsScreen: SettingsScreen,
    input: InputManager,
  ) {
    this.boardRenderer = boardRenderer;
    this.tileRenderer = tileRenderer;
    this.pieceRenderer = pieceRenderer;
    this.arrowRenderer = arrowRenderer;
    this.particles = particles;
    this.camera = camera;
    this.hud = hud;
    this.settingsScreen = settingsScreen;
    this.input = input;

    this.setupSettingsScreen();
    this.setupInput();
  }

  setOnScoreSubmit(callback: (score: number, meta: Record<string, unknown>) => void): void {
    this.onScoreSubmit = callback;
  }

  private setupSettingsScreen(): void {
    this.settingsScreen.onStart((settings) => {
      this.startGame(settings);
    });

    this.settingsScreen.onSettingsChange((settings) => {
      // Update board preview
      this.buildBoardPreview(settings);
    });
  }

  private setupInput(): void {
    this.input.onTileClick((row, col) => {
      if (this.phase !== 'planning' || !this.board) return;
      this.handleTileClick(row, col);
    });

    this.input.onTileHover((row, col) => {
      if (this.phase !== 'planning' || !this.board) return;
      this.tileRenderer.clearAllHighlights();

      // Highlight hovered tile
      const cell = this.board.grid[row]?.[col];
      if (cell && !cell.isObstacle) {
        this.tileRenderer.setTileHighlight(row, col, true);
      }
    });

    this.input.onTileHoverEnd(() => {
      this.tileRenderer.clearAllHighlights();
    });

    this.input.onKey('enter', () => {
      if (this.phase === 'planning') {
        this.submitPlan();
      } else if (this.phase === 'gameOver') {
        this.returnToSettings();
      }
    });

    this.input.onKey('escape', () => {
      if (this.phase === 'planning' && this.selectedPieceId !== null) {
        this.selectedPieceId = null;
        this.tileRenderer.clearAllHighlights();
        this.showValidTargetsForUnplanned();
      }
    });

    this.input.onKey('r', () => {
      if (this.phase === 'gameOver') {
        this.returnToSettings();
      }
    });
  }

  private buildBoardPreview(settings: GameSettings): void {
    this.boardRenderer.build(settings.gridSize);
    this.camera.setTarget(settings.gridSize);
    this.input.setGridSize(settings.gridSize);

    // Create a temporary board just for preview (tiles only, no pieces)
    const tempBoard = new Board(settings);
    this.tileRenderer.buildGrid(settings.gridSize, tempBoard.grid);
  }

  startGame(settings: GameSettings): void {
    this.settings = settings;
    this.board = new Board(settings);
    this.turn = 1;
    this.winner = null;
    this.selectedPieceId = null;
    this.scoreSubmitted = false;

    // Clear old state
    this.pieceRenderer.clearAll();
    this.arrowRenderer.clearAll();

    // Build board
    this.boardRenderer.build(settings.gridSize);
    this.tileRenderer.buildGrid(settings.gridSize, this.board.grid);
    this.camera.setTarget(settings.gridSize);
    this.input.setGridSize(settings.gridSize);

    // Spawn pieces
    for (const piece of this.board.pieces) {
      this.pieceRenderer.createPiece(piece);
    }

    // Update tile colors for starting positions
    for (const piece of this.board.pieces) {
      this.tileRenderer.setTileColor(piece.row, piece.col, PLAYER_COLORS[piece.owner], false);
      this.tileRenderer.setTileLift(piece.row, piece.col, true);
    }

    // Hide settings, start planning
    this.settingsScreen.hide();
    this.phase = 'planning';
    this.input.setEnabled(true);
    this.startPlanningPhase();
  }

  private startPlanningPhase(): void {
    this.phase = 'planning';
    this.selectedPieceId = null;

    if (!this.board) return;

    // Set planning pulse on player pieces
    const playerPieces = this.board.getAlivePieces(0 as PlayerID);
    for (const p of playerPieces) {
      this.pieceRenderer.setPlanningPulse(p.id, true);
    }

    // Start plan timer if configured
    if (this.settings && this.settings.planTimer > 0) {
      this.planTimerRemaining = this.settings.planTimer;
      this.planTimerActive = true;
    } else {
      this.planTimerRemaining = null;
      this.planTimerActive = false;
    }

    this.showValidTargetsForUnplanned();
  }

  private showValidTargetsForUnplanned(): void {
    if (!this.board) return;
    this.tileRenderer.clearAllHighlights();

    // If only one unplanned piece, auto-select it
    const playerPieces = this.board.getAlivePieces(0 as PlayerID);
    const unplanned = playerPieces.filter(p => !this.board!.getPlannedMove(p.id));

    if (unplanned.length === 1 && this.selectedPieceId === null) {
      this.selectedPieceId = unplanned[0].id;
    }

    if (this.selectedPieceId !== null) {
      const validMoves = this.board.getValidMoves(this.selectedPieceId);
      for (const vm of validMoves) {
        this.tileRenderer.setTileValidTarget(vm.row, vm.col, true, PLAYER_COLORS[0]);
      }
    }
  }

  private handleTileClick(row: number, col: number): void {
    if (!this.board) return;

    const playerPieces = this.board.getAlivePieces(0 as PlayerID);

    // Check if clicking on one of our pieces to select it
    const clickedPiece = playerPieces.find(p => p.row === row && p.col === col);
    if (clickedPiece) {
      this.selectedPieceId = clickedPiece.id;
      this.tileRenderer.clearAllHighlights();
      const validMoves = this.board.getValidMoves(clickedPiece.id);
      for (const vm of validMoves) {
        this.tileRenderer.setTileValidTarget(vm.row, vm.col, true, PLAYER_COLORS[0]);
      }
      return;
    }

    // If we have a selected piece, try to plan a move to this tile
    if (this.selectedPieceId !== null) {
      const success = this.board.planMove(this.selectedPieceId, row, col);
      if (success) {
        // Show arrow for this move
        const move = this.board.getPlannedMove(this.selectedPieceId)!;
        this.arrowRenderer.showArrow(move, 0 as PlayerID, 0.6);
        this.pieceRenderer.setPlanningPulse(this.selectedPieceId, false);

        // Auto-select next unplanned piece
        this.selectedPieceId = null;
        this.tileRenderer.clearAllHighlights();
        this.showValidTargetsForUnplanned();
      }
    }
  }

  private submitPlan(): void {
    if (!this.board || this.phase !== 'planning') return;

    // Allow submitting even if not all moves planned (pieces without plans stay put)
    const playerPieces = this.board.getAlivePieces(0 as PlayerID);
    for (const p of playerPieces) {
      this.pieceRenderer.setPlanningPulse(p.id, false);
    }

    // Compute AI moves
    const totalPlayers = 1 + this.board.settings.aiCount;
    for (let i = 1; i < totalPlayers; i++) {
      const aiMoves = this.ai.getMove(this.board, this.board.settings.aiDifficulty, i as PlayerID);
      for (const move of aiMoves) {
        this.board.planMove(move.pieceId, move.toRow, move.toCol);
      }
    }

    this.tileRenderer.clearAllHighlights();
    this.input.setEnabled(false);
    this.planTimerActive = false;

    this.revealPhase();
  }

  private async revealPhase(): Promise<void> {
    if (!this.board) return;
    this.phase = 'reveal';

    // Show all arrows
    const allMoves = this.board.getAllPlannedMoves();
    const piecesWithOwners = this.board.pieces.map(p => ({ id: p.id, owner: p.owner }));
    this.arrowRenderer.revealAll(allMoves, piecesWithOwners);

    // Dramatic pause
    await delay(REVEAL_PAUSE_DURATION);

    // Resolve
    await this.resolvePhase();
  }

  private async resolvePhase(): Promise<void> {
    if (!this.board) return;
    this.phase = 'resolving';

    const result = this.board.resolveAllMoves();

    // Clear arrows
    this.arrowRenderer.clearAll();

    // 1. Move all surviving pieces simultaneously
    const movePromises: Promise<void>[] = [];
    for (const move of result.moves) {
      if (result.deaths.some(d => d.id === move.pieceId)) continue;

      movePromises.push(new Promise<void>((resolve) => {
        this.pieceRenderer.movePiece(move.pieceId, move.fromRow, move.fromCol, move.toRow, move.toCol);
        setTimeout(resolve, PIECE_MOVE_DURATION);
      }));
    }

    if (movePromises.length > 0) {
      await Promise.all(movePromises);
    }

    // 2. Collision explosions
    if (result.deaths.length > 0) {
      this.camera.shake(0.15);

      const deathPromises: Promise<void>[] = [];
      for (const dead of result.deaths) {
        const pos = this.pieceRenderer.getPieceWorldPos(dead.id);
        if (pos) {
          const deathColors = result.collisions
            .find(c => c.pieces.some(p => p.id === dead.id))
            ?.pieces.map(p => PLAYER_COLORS[p.owner]) || [PLAYER_COLORS[dead.owner]];
          this.particles.emitCollision(pos.x, pos.z, [...deathColors]);
        }

        deathPromises.push(new Promise<void>((resolve) => {
          this.pieceRenderer.killPiece(dead.id);
          setTimeout(resolve, PIECE_DEATH_DURATION);
        }));
      }

      await Promise.all(deathPromises);
    }

    // 3. Territory color wave
    const captureDelay = Math.min(TILE_CAPTURE_DURATION, 500 / Math.max(1, result.captures.length));
    for (const capture of result.captures) {
      this.tileRenderer.setTileColor(capture.row, capture.col, PLAYER_COLORS[capture.owner], true);
      this.tileRenderer.setTileLift(capture.row, capture.col, true);

      const cx = capture.col * TILE_GAP;
      const cz = capture.row * TILE_GAP;
      this.particles.emitCapture(cx, cz, PLAYER_COLORS[capture.owner]);

      await delay(captureDelay);
    }

    // 4. Check win condition
    this.winner = result.winner;

    if (this.winner !== null) {
      this.phase = 'gameOver';

      // Victory particles
      const halfGrid = (this.board.size - 1) / 2;
      this.particles.emitVictory(halfGrid * TILE_GAP, halfGrid * TILE_GAP);

      // Submit score
      if (!this.scoreSubmitted && this.winner === 0) {
        this.scoreSubmitted = true;
        this.onScoreSubmit?.(this.turn, {
          gridSize: this.board.settings.gridSize,
          pieces: this.board.settings.piecesPerPlayer,
          difficulty: this.board.settings.aiDifficulty,
        });
      }

      this.input.setEnabled(true);
    } else {
      // Next turn
      this.turn++;
      this.startPlanningPhase();
      this.input.setEnabled(true);
    }
  }

  returnToSettings(): void {
    this.phase = 'settings';
    this.board = null;
    this.winner = null;
    this.selectedPieceId = null;
    this.pieceRenderer.clearAll();
    this.arrowRenderer.clearAll();
    this.tileRenderer.clearGrid();
    this.settingsScreen.show();

    // Rebuild preview
    if (this.settings) {
      this.buildBoardPreview(this.settings);
    }
  }

  update(dt: number): void {
    // Plan timer countdown
    if (this.planTimerActive && this.planTimerRemaining !== null && this.phase === 'planning') {
      this.planTimerRemaining -= dt / 1000;
      if (this.planTimerRemaining <= 0) {
        this.planTimerRemaining = 0;
        this.planTimerActive = false;
        this.submitPlan();
      }
    }
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getTurn(): number {
    return this.turn;
  }

  getWinner(): PlayerID | null {
    return this.winner;
  }

  getBoard(): Board | null {
    return this.board;
  }

  getSelectedPieceId(): number | null {
    return this.selectedPieceId;
  }

  getUnplannedCount(): number {
    if (!this.board) return 0;
    const playerPieces = this.board.getAlivePieces(0 as PlayerID);
    return playerPieces.filter(p => !this.board!.getPlannedMove(p.id)).length;
  }

  getPlanTimerRemaining(): number | null {
    return this.planTimerRemaining;
  }

  showSettings(): void {
    this.phase = 'settings';
    this.settingsScreen.show();
  }
}
