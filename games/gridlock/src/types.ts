export type PlayerID = 0 | 1 | 2 | 3;

export type GridSize = 6 | 8 | 10 | 12;
export type PiecesPerPlayer = 1 | 2 | 3 | 4;
export type AICount = 1 | 2 | 3;
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type ObstacleCount = 0 | 4 | 8 | 12;
export type WinTarget = 50 | 60 | 70 | 75;
export type PlanTimer = 0 | 10 | 15 | 30;

export interface GameSettings {
  gridSize: GridSize;
  piecesPerPlayer: PiecesPerPlayer;
  aiCount: AICount;
  aiDifficulty: AIDifficulty;
  obstacles: ObstacleCount;
  winTarget: WinTarget;
  planTimer: PlanTimer;
}

export interface Cell {
  owner: PlayerID | null;
  isObstacle: boolean;
}

export interface Piece {
  id: number;
  owner: PlayerID;
  row: number;
  col: number;
  alive: boolean;
}

export interface PlannedMove {
  pieceId: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export type GamePhase = 'settings' | 'planning' | 'reveal' | 'resolving' | 'gameOver';

export interface ResolveResult {
  moves: PlannedMove[];
  collisions: { row: number; col: number; pieces: Piece[] }[];
  captures: { row: number; col: number; owner: PlayerID }[];
  deaths: Piece[];
  winner: PlayerID | null;
}

export interface Direction {
  dr: number;
  dc: number;
}

export const DIRECTIONS: Direction[] = [
  { dr: -1, dc: 0 },  // up
  { dr: 1, dc: 0 },   // down
  { dr: 0, dc: -1 },  // left
  { dr: 0, dc: 1 },   // right
];
