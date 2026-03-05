import type { TetrominoType, GamePhase, RotationState, BlockPosition } from './types';
import { Board } from './Board';
import { Tetromino } from './Tetromino';
import {
  ALL_TYPES,
  BOARD_W,
  SCORING,
  GRAVITY_BASE,
  GRAVITY_FACTOR,
  GRAVITY_MIN,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  LINES_PER_LEVEL,
  SPAWN_ROW,
  TETROMINO_DATA,
} from './constants';

/** Core game logic controller for Tetris. */
export class GameController {
  board: Board;
  currentPiece: Tetromino | null = null;
  heldPiece: TetrominoType | null = null;
  canHold = true;
  ghostY = 0;
  bag: TetrominoType[] = [];
  nextPieces: TetrominoType[] = [];
  score = 0;
  level = 1;
  lines = 0;
  phase: GamePhase = 'title';
  gravityTimer = 0;
  lockTimer = 0;
  lockResets = 0;
  isOnGround = false;

  // Callbacks for rendering hooks
  onLineClear: ((rows: number[]) => void) | null = null;
  onPieceLock: ((blocks: BlockPosition[], color: number) => void) | null = null;

  // Line clear animation lock - prevents updates during animation
  private animating = false;

  constructor() {
    this.board = new Board();
  }

  /** Returns the gravity drop interval in ms based on current level. */
  get gravityInterval(): number {
    return Math.max(GRAVITY_MIN, GRAVITY_BASE - (this.level - 1) * GRAVITY_FACTOR);
  }

  /** Starts a new game, resetting all state. */
  start(): void {
    this.board.reset();
    this.currentPiece = null;
    this.heldPiece = null;
    this.canHold = true;
    this.bag = [];
    this.nextPieces = [];
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gravityTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isOnGround = false;
    this.animating = false;
    this.phase = 'playing';

    // Fill the next queue
    this.refillBag();
    for (let i = 0; i < 3; i++) {
      this.nextPieces.push(this.drawFromBag());
    }
    this.spawnPiece();
  }

  /** Main update tick. Call every frame with delta time in ms. */
  update(dt: number): void {
    if (this.phase !== 'playing' || !this.currentPiece || this.animating) return;

    // Check if piece is on the ground
    const onGround = this.isPieceOnGround();

    if (onGround) {
      if (!this.isOnGround) {
        // Just landed - start lock timer
        this.isOnGround = true;
        this.lockTimer = 0;
      }
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockCurrentPiece();
      }
    } else {
      this.isOnGround = false;
      this.lockTimer = 0;
      // Apply gravity
      this.gravityTimer += dt;
      if (this.gravityTimer >= this.gravityInterval) {
        this.gravityTimer = 0;
        this.moveDown();
      }
    }

    this.calculateGhostY();
  }

  /** Moves the current piece left. */
  moveLeft(): boolean {
    return this.tryMove(-1, 0);
  }

  /** Moves the current piece right. */
  moveRight(): boolean {
    return this.tryMove(1, 0);
  }

  /** Soft drop: move down 1 row, award 1 point. */
  softDrop(): boolean {
    if (!this.currentPiece) return false;
    if (this.tryMove(0, -1)) {
      this.score += 1;
      this.gravityTimer = 0;
      return true;
    }
    return false;
  }

  /** Hard drop: instant placement, 2 points per cell dropped. */
  hardDrop(): void {
    if (!this.currentPiece) return;

    let cellsDropped = 0;
    while (this.tryMove(0, -1)) {
      cellsDropped++;
    }
    this.score += cellsDropped * 2;
    this.lockCurrentPiece();
  }

  /** Rotates the piece. clockwise=true for CW, false for CCW. */
  rotate(clockwise: boolean): boolean {
    if (!this.currentPiece) return false;
    if (this.currentPiece.type === 'O') return false; // O doesn't rotate

    const piece = this.currentPiece;
    const fromRotation = piece.rotation;
    const toRotation: RotationState = clockwise
      ? ((fromRotation + 1) % 4) as RotationState
      : ((fromRotation + 3) % 4) as RotationState;

    const kicks = piece.getKicks(fromRotation, toRotation);

    for (const kick of kicks) {
      const testPiece = piece.clone();
      testPiece.rotation = toRotation;
      testPiece.x = piece.x + kick.x;
      testPiece.y = piece.y + kick.y;

      if (this.board.isValidPlacement(testPiece.getBlocks())) {
        piece.rotation = toRotation;
        piece.x = testPiece.x;
        piece.y = testPiece.y;
        this.resetLockIfOnGround();
        this.calculateGhostY();
        return true;
      }
    }
    return false;
  }

  /** Hold the current piece, swapping with held piece if one exists. */
  hold(): void {
    if (!this.currentPiece || !this.canHold) return;

    const currentType = this.currentPiece.type;

    if (this.heldPiece !== null) {
      // Swap with held piece
      const swapType = this.heldPiece;
      this.heldPiece = currentType;
      this.currentPiece = this.createPieceAtSpawn(swapType);
    } else {
      // Hold current, spawn next
      this.heldPiece = currentType;
      this.currentPiece = null;
      this.spawnPiece();
    }

    this.canHold = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isOnGround = false;
    this.calculateGhostY();
  }

  /** Toggle pause state. */
  togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
    }
  }

  /** Set animating flag (used by board renderer during line clear animation). */
  setAnimating(value: boolean): void {
    this.animating = value;
  }

  // -- Private helpers --

  private tryMove(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false;

    const piece = this.currentPiece;
    piece.x += dx;
    piece.y += dy;

    if (this.board.isValidPlacement(piece.getBlocks())) {
      if (dx !== 0) this.resetLockIfOnGround();
      return true;
    }

    // Revert
    piece.x -= dx;
    piece.y -= dy;
    return false;
  }

  private moveDown(): boolean {
    if (!this.currentPiece) return false;
    return this.tryMove(0, -1);
  }

  private isPieceOnGround(): boolean {
    if (!this.currentPiece) return false;
    const piece = this.currentPiece;
    piece.y -= 1;
    const valid = this.board.isValidPlacement(piece.getBlocks());
    piece.y += 1;
    return !valid;
  }

  private resetLockIfOnGround(): void {
    if (this.isOnGround && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockCurrentPiece(): void {
    if (!this.currentPiece) return;

    const blocks = this.currentPiece.getBlocks();
    const color = this.currentPiece.getColor();

    this.board.lockPiece(blocks, color);

    if (this.onPieceLock) {
      this.onPieceLock(blocks, color);
    }

    // Check for line clears
    const result = this.board.clearLines();
    if (result.count > 0) {
      this.addLineScore(result.count);
      this.lines += result.count;
      this.level = Math.floor(this.lines / LINES_PER_LEVEL) + 1;

      if (this.onLineClear) {
        this.animating = true;
        this.onLineClear(result.rows);
      }
    }

    // Reset for next piece
    this.canHold = true;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isOnGround = false;
    this.currentPiece = null;

    // Spawn next piece (unless animating - main.ts will call spawnPiece after animation)
    if (!this.animating) {
      this.spawnPiece();
    }
  }

  private addLineScore(count: number): void {
    const multiplier = this.level;
    switch (count) {
      case 1: this.score += SCORING.single * multiplier; break;
      case 2: this.score += SCORING.double * multiplier; break;
      case 3: this.score += SCORING.triple * multiplier; break;
      case 4: this.score += SCORING.tetris * multiplier; break;
    }
  }

  /** Spawns the next piece from the queue. */
  spawnPiece(): void {
    const type = this.nextPieces.shift()!;
    this.nextPieces.push(this.drawFromBag());

    this.currentPiece = this.createPieceAtSpawn(type);

    if (!this.board.isValidPlacement(this.currentPiece.getBlocks())) {
      // Game over
      this.phase = 'gameover';
      this.currentPiece = null;
    }

    this.calculateGhostY();
  }

  private createPieceAtSpawn(type: TetrominoType): Tetromino {
    // Spawn centered horizontally, at the top of the visible area
    const spawnX = type === 'O' ? 4 : 3;
    return new Tetromino(type, spawnX, SPAWN_ROW);
  }

  private drawFromBag(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }

  /** Fills the bag with a shuffled set of all 7 tetrominoes (Fisher-Yates). */
  private refillBag(): void {
    this.bag = [...ALL_TYPES];
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  /** Calculates the Y position where the ghost piece would land. */
  calculateGhostY(): void {
    if (!this.currentPiece) {
      this.ghostY = 0;
      return;
    }

    const piece = this.currentPiece;
    const origY = piece.y;
    let testY = origY;

    while (true) {
      piece.y = testY - 1;
      if (!this.board.isValidPlacement(piece.getBlocks())) {
        break;
      }
      testY--;
    }

    this.ghostY = testY;
    piece.y = origY;
  }
}
