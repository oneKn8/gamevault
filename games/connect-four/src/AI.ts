import { Board, ROWS, COLS, type CellValue } from './Board';

const AI_PLAYER: 1 | 2 = 2;
const HUMAN_PLAYER: 1 | 2 = 1;

function scoreWindow(window: CellValue[]): number {
  const aiCount = window.filter(c => c === AI_PLAYER).length;
  const humanCount = window.filter(c => c === HUMAN_PLAYER).length;
  const emptyCount = window.filter(c => c === 0).length;

  if (aiCount === 4) return 100000;
  if (humanCount === 4) return -100000;
  if (aiCount === 3 && emptyCount === 1) return 10;
  if (humanCount === 3 && emptyCount === 1) return -10;
  if (aiCount === 2 && emptyCount === 2) return 3;
  if (humanCount === 2 && emptyCount === 2) return -3;

  return 0;
}

function evaluate(board: Board): number {
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board.grid[r][centerCol] === AI_PLAYER) centerCount++;
  }
  score += centerCount * 4;

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window: CellValue[] = [
        board.grid[r][c], board.grid[r][c + 1],
        board.grid[r][c + 2], board.grid[r][c + 3],
      ];
      score += scoreWindow(window);
    }
  }

  // Vertical windows
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const window: CellValue[] = [
        board.grid[r][c], board.grid[r + 1][c],
        board.grid[r + 2][c], board.grid[r + 3][c],
      ];
      score += scoreWindow(window);
    }
  }

  // Diagonal (down-right)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const window: CellValue[] = [
        board.grid[r][c], board.grid[r + 1][c + 1],
        board.grid[r + 2][c + 2], board.grid[r + 3][c + 3],
      ];
      score += scoreWindow(window);
    }
  }

  // Diagonal (down-left)
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const window: CellValue[] = [
        board.grid[r][c], board.grid[r + 1][c - 1],
        board.grid[r + 2][c - 2], board.grid[r + 3][c - 3],
      ];
      score += scoreWindow(window);
    }
  }

  return score;
}

function isTerminal(board: Board): boolean {
  return (
    board.checkWin(AI_PLAYER) !== null ||
    board.checkWin(HUMAN_PLAYER) !== null ||
    board.isFull()
  );
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): number {
  if (depth === 0 || isTerminal(board)) {
    return evaluate(board);
  }

  const validCols = board.getValidColumns();

  if (maximizing) {
    let maxEval = -Infinity;
    for (const col of validCols) {
      board.dropDisc(col, AI_PLAYER);
      const evalScore = minimax(board, depth - 1, alpha, beta, false);
      board.undoDrop(col);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validCols) {
      board.dropDisc(col, HUMAN_PLAYER);
      const evalScore = minimax(board, depth - 1, alpha, beta, true);
      board.undoDrop(col);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(board: Board, depth: number = 4): number {
  const validCols = board.getValidColumns();
  if (validCols.length === 0) return -1;

  let bestScore = -Infinity;
  let bestCol = validCols[0];

  // Shuffle valid columns slightly to add variety when scores are equal
  // but always evaluate center first for better pruning
  const centerCol = Math.floor(COLS / 2);
  const sortedCols = [...validCols].sort((a, b) => {
    return Math.abs(a - centerCol) - Math.abs(b - centerCol);
  });

  for (const col of sortedCols) {
    board.dropDisc(col, AI_PLAYER);
    const score = minimax(board, depth - 1, -Infinity, Infinity, false);
    board.undoDrop(col);

    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}
