import type {
  GameSettings, Cell, Piece, PlannedMove, PlayerID,
  ResolveResult, Direction,
} from './types';
import { DIRECTIONS } from './types';

export class Board {
  readonly size: number;
  readonly grid: Cell[][];
  readonly pieces: Piece[];
  readonly settings: GameSettings;
  private plannedMoves: Map<number, PlannedMove> = new Map();
  private nextPieceId = 0;

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.size = settings.gridSize;
    this.grid = [];
    this.pieces = [];

    // Initialize empty grid
    for (let r = 0; r < this.size; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.size; c++) {
        row.push({ owner: null, isObstacle: false });
      }
      this.grid.push(row);
    }

    // Place obstacles
    this.placeObstacles(settings.obstacles);

    // Place pieces for all players
    const totalPlayers = 1 + settings.aiCount;
    for (let p = 0; p < totalPlayers; p++) {
      this.placePlayerPieces(p as PlayerID, totalPlayers);
    }
  }

  private placeObstacles(count: number): void {
    if (count === 0) return;
    const center = Math.floor(this.size / 2);
    const margin = 2; // keep corners clear for piece spawning
    const candidates: { r: number; c: number }[] = [];

    for (let r = margin; r < this.size - margin; r++) {
      for (let c = margin; c < this.size - margin; c++) {
        // Avoid dead center
        if (r === center && c === center) continue;
        if (r === center - 1 && c === center - 1) continue;
        candidates.push({ r, c });
      }
    }

    // Shuffle and pick
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const placed = Math.min(count, candidates.length);
    for (let i = 0; i < placed; i++) {
      const { r, c } = candidates[i];
      this.grid[r][c].isObstacle = true;
    }
  }

  private placePlayerPieces(player: PlayerID, totalPlayers: number): void {
    // Place pieces in corners/edges based on player index
    const corners = [
      { r: 0, c: 0 },                          // top-left
      { r: 0, c: this.size - 1 },               // top-right
      { r: this.size - 1, c: this.size - 1 },   // bottom-right
      { r: this.size - 1, c: 0 },               // bottom-left
    ];

    const corner = corners[player % corners.length];
    const piecesToPlace = this.settings.piecesPerPlayer;

    // Spiral outward from corner to find valid positions
    const positions = this.findSpawnPositions(corner.r, corner.c, piecesToPlace);

    for (const pos of positions) {
      const piece: Piece = {
        id: this.nextPieceId++,
        owner: player,
        row: pos.r,
        col: pos.c,
        alive: true,
      };
      this.pieces.push(piece);
      // Claim starting tile
      this.grid[pos.r][pos.c].owner = player;
    }
  }

  private findSpawnPositions(startR: number, startC: number, count: number): { r: number; c: number }[] {
    const positions: { r: number; c: number }[] = [];
    const visited = new Set<string>();

    const queue = [{ r: startR, c: startC }];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0 && positions.length < count) {
      const curr = queue.shift()!;
      if (!this.grid[curr.r][curr.c].isObstacle) {
        positions.push(curr);
      }

      for (const d of DIRECTIONS) {
        const nr = curr.r + d.dr;
        const nc = curr.c + d.dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !visited.has(key)) {
          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      }
    }

    return positions;
  }

  planMove(pieceId: number, toRow: number, toCol: number): boolean {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece || !piece.alive) return false;

    // Validate adjacency
    const dr = Math.abs(toRow - piece.row);
    const dc = Math.abs(toCol - piece.col);
    if (dr + dc !== 1) return false;

    // Validate bounds and not obstacle
    if (toRow < 0 || toRow >= this.size || toCol < 0 || toCol >= this.size) return false;
    if (this.grid[toRow][toCol].isObstacle) return false;

    this.plannedMoves.set(pieceId, {
      pieceId,
      fromRow: piece.row,
      fromCol: piece.col,
      toRow,
      toCol,
    });
    return true;
  }

  clearPlan(pieceId: number): void {
    this.plannedMoves.delete(pieceId);
  }

  clearAllPlans(): void {
    this.plannedMoves.clear();
  }

  getPlannedMove(pieceId: number): PlannedMove | undefined {
    return this.plannedMoves.get(pieceId);
  }

  getAllPlannedMoves(): PlannedMove[] {
    return Array.from(this.plannedMoves.values());
  }

  getPlayerPlannedMoves(player: PlayerID): PlannedMove[] {
    return this.getAllPlannedMoves().filter(m => {
      const piece = this.pieces.find(p => p.id === m.pieceId);
      return piece && piece.owner === player;
    });
  }

  hasAllPlayerMoves(player: PlayerID): boolean {
    const alivePieces = this.pieces.filter(p => p.owner === player && p.alive);
    return alivePieces.every(p => this.plannedMoves.has(p.id));
  }

  resolveAllMoves(): ResolveResult {
    const moves = this.getAllPlannedMoves();
    const deaths: Piece[] = [];
    const collisions: { row: number; col: number; pieces: Piece[] }[] = [];
    const captures: { row: number; col: number; owner: PlayerID }[] = [];

    // Build target map: which pieces are trying to move where
    const targetMap = new Map<string, PlannedMove[]>();
    for (const move of moves) {
      const key = `${move.toRow},${move.toCol}`;
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key)!.push(move);
    }

    // Detect swap collisions (A->B and B->A)
    const swapDeaths = new Set<number>();
    for (const move of moves) {
      for (const other of moves) {
        if (move.pieceId === other.pieceId) continue;
        if (
          move.fromRow === other.toRow && move.fromCol === other.toCol &&
          move.toRow === other.fromRow && move.toCol === other.fromCol
        ) {
          swapDeaths.add(move.pieceId);
          swapDeaths.add(other.pieceId);
        }
      }
    }

    // Detect tile collisions (2+ pieces targeting same cell)
    const tileDeaths = new Set<number>();
    for (const [, movesAtTarget] of targetMap) {
      if (movesAtTarget.length > 1) {
        const collidingPieces: Piece[] = [];
        for (const m of movesAtTarget) {
          tileDeaths.add(m.pieceId);
          const piece = this.pieces.find(p => p.id === m.pieceId)!;
          collidingPieces.push(piece);
        }
        const first = movesAtTarget[0];
        collisions.push({ row: first.toRow, col: first.toCol, pieces: collidingPieces });
      }
    }

    // Mark dead pieces
    const allDeadIds = new Set([...swapDeaths, ...tileDeaths]);
    for (const id of allDeadIds) {
      const piece = this.pieces.find(p => p.id === id);
      if (piece) {
        piece.alive = false;
        deaths.push(piece);
      }
    }

    // Move surviving pieces and update territory
    for (const move of moves) {
      if (allDeadIds.has(move.pieceId)) continue;
      const piece = this.pieces.find(p => p.id === move.pieceId)!;
      piece.row = move.toRow;
      piece.col = move.toCol;
      this.grid[move.toRow][move.toCol].owner = piece.owner;
      captures.push({ row: move.toRow, col: move.toCol, owner: piece.owner });
    }

    // Add swap collision locations
    for (const id of swapDeaths) {
      const piece = this.pieces.find(p => p.id === id)!;
      const move = moves.find(m => m.pieceId === id)!;
      // Collision happens at the midpoint conceptually, but we render at target
      const existing = collisions.find(c => c.row === move.toRow && c.col === move.toCol);
      if (!existing) {
        collisions.push({ row: move.toRow, col: move.toCol, pieces: [piece] });
      }
    }

    this.plannedMoves.clear();

    const winner = this.checkWinCondition();

    return { moves, collisions, captures, deaths, winner };
  }

  getTerritoryCounts(): Map<PlayerID, number> {
    const counts = new Map<PlayerID, number>();
    let totalPlayable = 0;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c].isObstacle) continue;
        totalPlayable++;
        const owner = this.grid[r][c].owner;
        if (owner !== null) {
          counts.set(owner, (counts.get(owner) || 0) + 1);
        }
      }
    }

    return counts;
  }

  getTotalPlayableTiles(): number {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c].isObstacle) count++;
      }
    }
    return count;
  }

  checkWinCondition(): PlayerID | null {
    const totalPlayers = 1 + this.settings.aiCount;
    const alivePlayers = new Set<PlayerID>();
    for (const p of this.pieces) {
      if (p.alive) alivePlayers.add(p.owner);
    }

    // Last player alive wins
    if (alivePlayers.size === 1) {
      return alivePlayers.values().next().value!;
    }

    // Territory target reached
    const counts = this.getTerritoryCounts();
    const totalPlayable = this.getTotalPlayableTiles();
    const targetTiles = Math.ceil(totalPlayable * this.settings.winTarget / 100);

    for (let p = 0; p < totalPlayers; p++) {
      const pid = p as PlayerID;
      if ((counts.get(pid) || 0) >= targetTiles) {
        return pid;
      }
    }

    // No alive pieces at all = draw (return player with most territory)
    if (alivePlayers.size === 0) {
      let maxOwner: PlayerID = 0;
      let maxCount = 0;
      for (const [pid, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          maxOwner = pid;
        }
      }
      return maxOwner;
    }

    return null;
  }

  getValidMoves(pieceId: number): { row: number; col: number }[] {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece || !piece.alive) return [];

    const valid: { row: number; col: number }[] = [];
    for (const d of DIRECTIONS) {
      const nr = piece.row + d.dr;
      const nc = piece.col + d.dc;
      if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !this.grid[nr][nc].isObstacle) {
        valid.push({ row: nr, col: nc });
      }
    }
    return valid;
  }

  getAlivePieces(player: PlayerID): Piece[] {
    return this.pieces.filter(p => p.owner === player && p.alive);
  }

  clone(): Board {
    const cloned = Object.create(Board.prototype) as Board;
    (cloned as any).settings = this.settings;
    (cloned as any).size = this.size;
    (cloned as any).nextPieceId = this.nextPieceId;
    (cloned as any).plannedMoves = new Map(this.plannedMoves);

    // Deep copy grid
    (cloned as any).grid = this.grid.map(row =>
      row.map(cell => ({ ...cell }))
    );

    // Deep copy pieces
    (cloned as any).pieces = this.pieces.map(p => ({ ...p }));

    return cloned;
  }
}
