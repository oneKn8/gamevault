export const COLS = 7;
export const ROWS = 6;

export type CellValue = 0 | 1 | 2;

export class Board {
  grid: CellValue[][];

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): CellValue[][] {
    const grid: CellValue[][] = [];
    for (let r = 0; r < ROWS; r++) {
      grid.push(new Array<CellValue>(COLS).fill(0));
    }
    return grid;
  }

  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  dropDisc(col: number, player: 1 | 2): { row: number; col: number } | null {
    if (col < 0 || col >= COLS) return null;
    // Drop from bottom up
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) {
        this.grid[r][col] = player;
        return { row: r, col };
      }
    }
    return null;
  }

  undoDrop(col: number): void {
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r][col] !== 0) {
        this.grid[r][col] = 0;
        return;
      }
    }
  }

  checkWin(player: 1 | 2): number[][] | null {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (
          this.grid[r][c] === player &&
          this.grid[r][c + 1] === player &&
          this.grid[r][c + 2] === player &&
          this.grid[r][c + 3] === player
        ) {
          return [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]];
        }
      }
    }

    // Vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        if (
          this.grid[r][c] === player &&
          this.grid[r + 1][c] === player &&
          this.grid[r + 2][c] === player &&
          this.grid[r + 3][c] === player
        ) {
          return [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]];
        }
      }
    }

    // Diagonal (down-right)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (
          this.grid[r][c] === player &&
          this.grid[r + 1][c + 1] === player &&
          this.grid[r + 2][c + 2] === player &&
          this.grid[r + 3][c + 3] === player
        ) {
          return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
        }
      }
    }

    // Diagonal (down-left)
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 3; c < COLS; c++) {
        if (
          this.grid[r][c] === player &&
          this.grid[r + 1][c - 1] === player &&
          this.grid[r + 2][c - 2] === player &&
          this.grid[r + 3][c - 3] === player
        ) {
          return [[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]];
        }
      }
    }

    return null;
  }

  isFull(): boolean {
    for (let c = 0; c < COLS; c++) {
      if (this.grid[0][c] === 0) return false;
    }
    return true;
  }

  getValidColumns(): number[] {
    const valid: number[] = [];
    for (let c = 0; c < COLS; c++) {
      if (this.grid[0][c] === 0) valid.push(c);
    }
    return valid;
  }

  clone(): Board {
    const copy = new Board();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        copy.grid[r][c] = this.grid[r][c];
      }
    }
    return copy;
  }
}
