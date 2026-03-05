/** Movement direction for the snake. */
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

/** Current phase of the game lifecycle. */
export type GamePhase = 'title' | 'playing' | 'gameover';

/** A position on the grid (integer coordinates). */
export interface GridPosition {
  x: number;
  y: number;
}

/** A visual particle used for effects (eat burst, death explosion, trail). */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
