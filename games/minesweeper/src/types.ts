export type Difficulty = 'beginner' | 'intermediate' | 'expert';
export type CellState = 'hidden' | 'revealed' | 'flagged';
export type GamePhase = 'menu' | 'playing' | 'won' | 'lost';

export interface Cell {
  mine: boolean;
  state: CellState;
  adjacentMines: number;
}

export interface DifficultyConfig {
  name: string;
  cols: number;
  rows: number;
  mines: number;
  cellSize: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export interface TileAnimation {
  row: number;
  col: number;
  progress: number;
  duration: number;
  delay: number;
}
