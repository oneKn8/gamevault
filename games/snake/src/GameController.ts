import { Snake } from './Snake';
import { Direction, type GamePhase, type GridPosition } from './types';
import { GRID_W, GRID_H, BASE_SPEED, MIN_SPEED } from './constants';

/** Opposite directions lookup for preventing 180-degree reversals. */
const OPPOSITES: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

/**
 * Manages game state: snake movement ticks, food spawning,
 * scoring, direction queuing, and phase transitions.
 */
export class GameController {
  snake: Snake;
  food: GridPosition;
  score: number;
  phase: GamePhase;

  /** Buffered direction inputs (max 2). */
  directionQueue: Direction[];

  /** Accumulated time toward the next movement tick (in ms). */
  private tickTimer: number;

  /** Current ms between ticks -- decreases as the snake grows. */
  private tickInterval: number;

  /** Called when the snake eats food. Receives the food grid position. */
  onEatCallback: ((pos: GridPosition) => void) | null;

  /** Called when the snake dies. Receives the full segment array. */
  onDieCallback: ((segments: GridPosition[]) => void) | null;

  constructor() {
    this.snake = new Snake(Math.floor(GRID_W / 2), Math.floor(GRID_H / 2));
    this.food = { x: 0, y: 0 };
    this.score = 0;
    this.phase = 'title';
    this.directionQueue = [];
    this.tickTimer = 0;
    this.tickInterval = BASE_SPEED;
    this.onEatCallback = null;
    this.onDieCallback = null;
    this.spawnFood();
  }

  /** Reset the game to a fresh playing state. */
  reset(): void {
    this.snake = new Snake(Math.floor(GRID_W / 2), Math.floor(GRID_H / 2));
    this.score = 0;
    this.directionQueue = [];
    this.tickTimer = 0;
    this.tickInterval = BASE_SPEED;
    this.spawnFood();
    this.phase = 'playing';
  }

  /**
   * Queue a direction change. Prevents 180-degree reversal and
   * limits the queue to 2 entries to avoid input flooding.
   */
  queueDirection(dir: Direction): void {
    if (this.directionQueue.length >= 2) return;

    // The reference direction is the last queued one, or the current snake direction.
    const refDir =
      this.directionQueue.length > 0
        ? this.directionQueue[this.directionQueue.length - 1]
        : this.snake.direction;

    // Disallow reversing or queueing the same direction.
    if (dir === refDir || dir === OPPOSITES[refDir]) return;

    this.directionQueue.push(dir);
  }

  /**
   * Advance game state by `dt` seconds.
   * Movement is tick-based: time accumulates until tickInterval is reached.
   */
  update(dt: number): void {
    if (this.phase !== 'playing') return;

    this.tickTimer += dt * 1000;

    while (this.tickTimer >= this.tickInterval) {
      this.tickTimer -= this.tickInterval;
      this.tick();

      if (this.phase !== 'playing') break;
    }
  }

  /** Returns a score multiplier based on snake length. */
  getScoreMultiplier(): number {
    return 1 + Math.floor(this.snake.segments.length / 10) * 0.1;
  }

  /** Place food at a random cell that is not occupied by the snake. */
  spawnFood(): void {
    const occupied = new Set(
      this.snake.segments.map((s) => `${s.x},${s.y}`)
    );

    // Collect all free cells.
    const free: GridPosition[] = [];
    for (let x = 0; x < GRID_W; x++) {
      for (let y = 0; y < GRID_H; y++) {
        if (!occupied.has(`${x},${y}`)) {
          free.push({ x, y });
        }
      }
    }

    if (free.length === 0) return;

    this.food = free[Math.floor(Math.random() * free.length)];
  }

  /** Execute one movement tick. */
  private tick(): void {
    // Dequeue the next buffered direction.
    if (this.directionQueue.length > 0) {
      this.snake.direction = this.directionQueue.shift()!;
    }

    this.snake.move();

    // Check collisions.
    if (
      this.snake.checkWallCollision(GRID_W, GRID_H) ||
      this.snake.checkSelfCollision()
    ) {
      this.phase = 'gameover';
      this.onDieCallback?.(this.snake.segments);
      return;
    }

    // Check food consumption.
    const head = this.snake.getHead();
    if (head.x === this.food.x && head.y === this.food.y) {
      this.snake.grow();
      this.score += Math.round(10 * this.getScoreMultiplier());
      this.onEatCallback?.({ ...this.food });
      this.spawnFood();

      // Speed up as the snake grows.
      this.tickInterval = Math.max(
        MIN_SPEED,
        BASE_SPEED - this.snake.segments.length * 2
      );
    }
  }
}
