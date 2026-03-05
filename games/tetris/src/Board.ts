import type { BlockPosition, LineClearResult } from './types';
import { BOARD_W, TOTAL_ROWS } from './constants';

/** Represents the Tetris playfield grid. */
export class Board {
  // grid[row][col] - row 0 is bottom, null means empty, number is hex color
  grid: (number | null)[][];

  constructor() {
    this.grid = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
      this.grid.push(new Array<number | null>(BOARD_W).fill(null));
    }
  }

  /** Checks if the given block positions are all within bounds and on empty cells. */
  isValidPlacement(blocks: BlockPosition[]): boolean {
    for (const b of blocks) {
      if (b.x < 0 || b.x >= BOARD_W) return false;
      if (b.y < 0 || b.y >= TOTAL_ROWS) return false;
      if (this.grid[b.y][b.x] !== null) return false;
    }
    return true;
  }

  /** Writes blocks to the grid with the given color. */
  lockPiece(blocks: BlockPosition[], color: number): void {
    for (const b of blocks) {
      if (b.y >= 0 && b.y < TOTAL_ROWS && b.x >= 0 && b.x < BOARD_W) {
        this.grid[b.y][b.x] = color;
      }
    }
  }

  /** Finds and clears all full rows. Returns the cleared row indices. */
  clearLines(): LineClearResult {
    const fullRows: number[] = [];

    for (let row = 0; row < TOTAL_ROWS; row++) {
      if (this.grid[row].every(cell => cell !== null)) {
        fullRows.push(row);
      }
    }

    if (fullRows.length === 0) {
      return { count: 0, rows: [] };
    }

    // Remove full rows from bottom to top and insert empty rows at top
    // Sort descending so we remove from top first to keep indices stable
    const sorted = [...fullRows].sort((a, b) => b - a);
    for (const row of sorted) {
      this.grid.splice(row, 1);
    }
    // Add empty rows at the top to maintain total height
    for (let i = 0; i < sorted.length; i++) {
      this.grid.push(new Array<number | null>(BOARD_W).fill(null));
    }

    return { count: fullRows.length, rows: fullRows };
  }

  /** Returns all filled cells with their row, col, and color. */
  getFilledCells(): { row: number; col: number; color: number }[] {
    const cells: { row: number; col: number; color: number }[] = [];
    for (let row = 0; row < TOTAL_ROWS; row++) {
      for (let col = 0; col < BOARD_W; col++) {
        const c = this.grid[row][col];
        if (c !== null) {
          cells.push({ row, col, color: c });
        }
      }
    }
    return cells;
  }

  /** Resets the entire board to empty. */
  reset(): void {
    for (let row = 0; row < TOTAL_ROWS; row++) {
      this.grid[row].fill(null);
    }
  }
}
