export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';
export type RotationState = 0 | 1 | 2 | 3;

export interface BlockPosition {
  x: number;
  y: number;
}

export interface TetrominoData {
  blocks: BlockPosition[][];
  color: number;
  emissive: number;
}

export interface LineClearResult {
  count: number;
  rows: number[];
}
