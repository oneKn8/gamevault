import type { Cell, DifficultyConfig } from './types';

export class Board {
  grid: Cell[][];
  cols: number;
  rows: number;
  mineCount: number;
  minesPlaced: boolean;

  constructor(config: DifficultyConfig) {
    this.cols = config.cols;
    this.rows = config.rows;
    this.mineCount = config.mines;
    this.minesPlaced = false;
    this.grid = [];

    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({ mine: false, state: 'hidden', adjacentMines: 0 });
      }
      this.grid.push(row);
    }
  }

  /** Place mines randomly, ensuring a 3x3 safe zone around the first click. */
  placeMines(safeRow: number, safeCol: number): void {
    if (this.minesPlaced) return;

    const safeCells = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        safeCells.add(`${safeRow + dr},${safeCol + dc}`);
      }
    }

    let placed = 0;
    while (placed < this.mineCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c].mine) continue;
      if (safeCells.has(`${r},${c}`)) continue;
      this.grid[r][c].mine = true;
      placed++;
    }

    this.calculateAdjacent();
    this.minesPlaced = true;
  }

  /** Calculate the adjacent mine count for every cell. */
  private calculateAdjacent(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) {
          this.grid[r][c].adjacentMines = -1;
          continue;
        }
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc].mine) {
              count++;
            }
          }
        }
        this.grid[r][c].adjacentMines = count;
      }
    }
  }

  /**
   * Reveal a cell. If it has 0 adjacent mines, flood-fill reveal neighbors.
   * Returns the array of cells that were revealed (for animation).
   */
  reveal(row: number, col: number): { row: number; col: number }[] {
    const cell = this.getCell(row, col);
    if (!cell || cell.state !== 'hidden') return [];

    const revealed: { row: number; col: number }[] = [];
    const queue: { row: number; col: number }[] = [{ row, col }];

    while (queue.length > 0) {
      const { row: r, col: c } = queue.shift()!;
      const current = this.getCell(r, c);
      if (!current || current.state !== 'hidden') continue;

      current.state = 'revealed';
      revealed.push({ row: r, col: c });

      // Flood-fill if zero adjacent mines and not a mine
      if (current.adjacentMines === 0 && !current.mine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            const neighbor = this.getCell(nr, nc);
            if (neighbor && neighbor.state === 'hidden') {
              queue.push({ row: nr, col: nc });
            }
          }
        }
      }
    }

    return revealed;
  }

  /** Toggle flag on a hidden cell. */
  toggleFlag(row: number, col: number): void {
    const cell = this.getCell(row, col);
    if (!cell) return;
    if (cell.state === 'hidden') {
      cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
      cell.state = 'hidden';
    }
  }

  /** Check if all non-mine cells have been revealed. */
  checkWin(): boolean {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell.mine && cell.state !== 'revealed') return false;
      }
    }
    return true;
  }

  /** Reveal all mines (called on loss). */
  revealAllMines(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) {
          this.grid[r][c].state = 'revealed';
        }
      }
    }
  }

  /** Count the number of flagged cells. */
  getFlagCount(): number {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].state === 'flagged') count++;
      }
    }
    return count;
  }

  /** Bounds-checked cell getter. Returns null if out of bounds. */
  getCell(row: number, col: number): Cell | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }
}
