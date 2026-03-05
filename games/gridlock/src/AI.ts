import type { PlayerID, PlannedMove, AIDifficulty } from './types';
import { Board } from './Board';

export class AI {
  getMove(board: Board, difficulty: AIDifficulty, playerID: PlayerID): PlannedMove[] {
    const alivePieces = board.getAlivePieces(playerID);
    if (alivePieces.length === 0) return [];

    switch (difficulty) {
      case 'easy':
        return this.easyMove(board, playerID);
      case 'medium':
        return this.mediumMove(board, playerID);
      case 'hard':
        return this.hardMove(board, playerID);
    }
  }

  private easyMove(board: Board, playerID: PlayerID): PlannedMove[] {
    const pieces = board.getAlivePieces(playerID);
    const moves: PlannedMove[] = [];

    for (const piece of pieces) {
      const valid = board.getValidMoves(piece.id);
      if (valid.length === 0) continue;
      const target = valid[Math.floor(Math.random() * valid.length)];
      moves.push({
        pieceId: piece.id,
        fromRow: piece.row,
        fromCol: piece.col,
        toRow: target.row,
        toCol: target.col,
      });
    }

    return moves;
  }

  private mediumMove(board: Board, playerID: PlayerID): PlannedMove[] {
    const pieces = board.getAlivePieces(playerID);
    const moves: PlannedMove[] = [];

    for (const piece of pieces) {
      const valid = board.getValidMoves(piece.id);
      if (valid.length === 0) continue;

      let bestTarget = valid[0];
      let bestScore = -Infinity;

      for (const target of valid) {
        const score = this.evaluateMove(board, piece.id, playerID, target.row, target.col);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = target;
        }
      }

      moves.push({
        pieceId: piece.id,
        fromRow: piece.row,
        fromCol: piece.col,
        toRow: bestTarget.row,
        toCol: bestTarget.col,
      });
    }

    return moves;
  }

  private hardMove(board: Board, playerID: PlayerID): PlannedMove[] {
    const pieces = board.getAlivePieces(playerID);
    const moves: PlannedMove[] = [];

    if (pieces.length <= 2) {
      // Joint evaluation for small piece counts
      return this.jointEvaluation(board, playerID, pieces);
    }

    // Greedy per-piece with collision avoidance
    const usedTargets = new Set<string>();

    for (const piece of pieces) {
      const valid = board.getValidMoves(piece.id);
      if (valid.length === 0) continue;

      let bestTarget = valid[0];
      let bestScore = -Infinity;

      for (const target of valid) {
        const key = `${target.row},${target.col}`;
        let score = this.evaluateMove(board, piece.id, playerID, target.row, target.col);

        // Bonus for unclaimed territory
        if (board.grid[target.row][target.col].owner === null) {
          score += 3;
        }

        // Collision avoidance: penalize tiles near enemy pieces
        score += this.collisionAvoidanceScore(board, playerID, target.row, target.col);

        // Territory clustering bonus
        score += this.clusteringScore(board, playerID, target.row, target.col);

        // Penalize if another of our pieces is already going there
        if (usedTargets.has(key)) {
          score -= 10;
        }

        if (score > bestScore) {
          bestScore = score;
          bestTarget = target;
        }
      }

      usedTargets.add(`${bestTarget.row},${bestTarget.col}`);

      moves.push({
        pieceId: piece.id,
        fromRow: piece.row,
        fromCol: piece.col,
        toRow: bestTarget.row,
        toCol: bestTarget.col,
      });
    }

    return moves;
  }

  private jointEvaluation(board: Board, playerID: PlayerID, pieces: { id: number; row: number; col: number }[]): PlannedMove[] {
    if (pieces.length === 0) return [];

    if (pieces.length === 1) {
      const piece = pieces[0];
      const valid = board.getValidMoves(piece.id);
      if (valid.length === 0) return [];

      let bestTarget = valid[0];
      let bestScore = -Infinity;

      for (const target of valid) {
        let score = this.evaluateMove(board, piece.id, playerID, target.row, target.col);
        score += this.collisionAvoidanceScore(board, playerID, target.row, target.col);
        score += this.clusteringScore(board, playerID, target.row, target.col);
        if (score > bestScore) {
          bestScore = score;
          bestTarget = target;
        }
      }

      return [{
        pieceId: piece.id,
        fromRow: piece.row,
        fromCol: piece.col,
        toRow: bestTarget.row,
        toCol: bestTarget.col,
      }];
    }

    // 2 pieces: try all combinations
    const p0Valid = board.getValidMoves(pieces[0].id);
    const p1Valid = board.getValidMoves(pieces[1].id);
    if (p0Valid.length === 0 && p1Valid.length === 0) return [];

    let bestMoves: PlannedMove[] = [];
    let bestScore = -Infinity;

    const targets0 = p0Valid.length > 0 ? p0Valid : [{ row: pieces[0].row, col: pieces[0].col }];
    const targets1 = p1Valid.length > 0 ? p1Valid : [{ row: pieces[1].row, col: pieces[1].col }];

    for (const t0 of targets0) {
      for (const t1 of targets1) {
        // Penalize same target
        let score = 0;
        if (t0.row === t1.row && t0.col === t1.col) {
          score -= 20;
        }

        score += this.evaluateMove(board, pieces[0].id, playerID, t0.row, t0.col);
        score += this.evaluateMove(board, pieces[1].id, playerID, t1.row, t1.col);
        score += this.collisionAvoidanceScore(board, playerID, t0.row, t0.col);
        score += this.collisionAvoidanceScore(board, playerID, t1.row, t1.col);
        score += this.clusteringScore(board, playerID, t0.row, t0.col);
        score += this.clusteringScore(board, playerID, t1.row, t1.col);

        if (score > bestScore) {
          bestScore = score;
          bestMoves = [];
          if (p0Valid.length > 0) {
            bestMoves.push({
              pieceId: pieces[0].id,
              fromRow: pieces[0].row,
              fromCol: pieces[0].col,
              toRow: t0.row,
              toCol: t0.col,
            });
          }
          if (p1Valid.length > 0) {
            bestMoves.push({
              pieceId: pieces[1].id,
              fromRow: pieces[1].row,
              fromCol: pieces[1].col,
              toRow: t1.row,
              toCol: t1.col,
            });
          }
        }
      }
    }

    return bestMoves;
  }

  private evaluateMove(board: Board, _pieceId: number, playerID: PlayerID, toRow: number, toCol: number): number {
    let score = 0;
    const size = board.size;
    const center = (size - 1) / 2;

    // Prefer unclaimed territory
    const cell = board.grid[toRow][toCol];
    if (cell.owner === null) {
      score += 5;
    } else if (cell.owner !== playerID) {
      // Taking enemy territory is good
      score += 3;
    } else {
      // Moving to own territory is less valuable
      score += 0;
    }

    // Center proximity (normalized 0-2)
    const distFromCenter = Math.abs(toRow - center) + Math.abs(toCol - center);
    const maxDist = center * 2;
    score += (1 - distFromCenter / maxDist) * 2;

    return score;
  }

  private collisionAvoidanceScore(board: Board, playerID: PlayerID, row: number, col: number): number {
    let score = 0;
    // Check if enemy pieces are adjacent to target -- they might also move there
    for (const piece of board.pieces) {
      if (!piece.alive || piece.owner === playerID) continue;
      const dist = Math.abs(piece.row - row) + Math.abs(piece.col - col);
      if (dist === 0) {
        // Enemy on this tile -- very dangerous
        score -= 8;
      } else if (dist === 1) {
        // Enemy adjacent -- might collide
        score -= 3;
      } else if (dist === 2) {
        // Enemy close
        score -= 1;
      }
    }
    return score;
  }

  private clusteringScore(board: Board, playerID: PlayerID, row: number, col: number): number {
    let score = 0;
    // Check adjacent tiles for friendly territory
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < board.size && nc >= 0 && nc < board.size) {
        if (board.grid[nr][nc].owner === playerID) {
          score += 1;
        }
      }
    }
    return score;
  }
}
