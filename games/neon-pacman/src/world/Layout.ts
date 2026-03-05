import { Tile, Vec2 } from '../types';
import { TILE_SIZE } from '../constants';

/**
 * Directional wall-connection flags for rendering.
 * Each boolean indicates whether the adjacent tile in that direction is also a wall.
 */
export interface WallConnections {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
}

/** Characters recognized in the .lay ASCII format. */
const WALL_CHAR = '%';
const FOOD_CHAR = '.';
const CAPSULE_CHAR = 'o';
const PACMAN_CHAR = 'P';
const GHOST_CHARS = new Set(['G', '1', '2', '3', '4']);

/**
 * Default pacman start position used when a layout has no `P` marker.
 * Falls back to the center of the grid.
 */
function defaultPacmanStart(width: number, height: number): Tile {
  return { col: Math.floor(width / 2), row: height - 2 };
}

/**
 * Parses a `.lay` format ASCII maze file into a queryable game grid.
 *
 * Coordinate convention:
 * - `col` increases left-to-right (x axis).
 * - `row` increases top-to-bottom (y axis). Row 0 is the top of the screen.
 * - Internal 2D arrays are indexed as `[col][row]`.
 *
 * The parser recognises the following characters:
 * | Char | Meaning          |
 * |------|------------------|
 * | `%`  | Wall             |
 * | `.`  | Food dot         |
 * | `o`  | Power capsule    |
 * | `P`  | Pacman start     |
 * | `G`  | Ghost start      |
 * | `1`-`4` | Ghost start (numbered) |
 * | ` `  | Empty floor      |
 */
export class Layout {
  /** Number of columns in the grid. */
  readonly width: number;

  /** Number of rows in the grid. */
  readonly height: number;

  /**
   * Wall presence grid. `walls[col][row]` is `true` when the tile is solid.
   * This array is immutable after construction.
   */
  readonly walls: boolean[][];

  /**
   * Food-dot presence grid. `food[col][row]` is `true` when the tile contains
   * a food dot that has not yet been eaten. Mutated during gameplay via
   * {@link eatFood}.
   */
  readonly food: boolean[][];

  /**
   * Remaining power capsules on the board. Items are spliced out when
   * consumed via {@link eatCapsule}.
   */
  readonly capsules: Tile[];

  /** Tile where Pacman spawns at the start of a life / level. */
  readonly pacmanStart: Tile;

  /** Tiles where ghosts spawn. Order matches the layout file top-to-bottom,
   *  left-to-right. */
  readonly ghostStarts: Tile[];

  /** The total number of food dots when the level is fully stocked. */
  readonly totalDots: number;

  // ------------------------------------------------------------------
  // Private bookkeeping for resetFood()
  // ------------------------------------------------------------------

  /** Original food grid snapshot (immutable after construction). */
  private readonly _originalFood: boolean[][];

  /** Original capsule positions (immutable after construction). */
  private readonly _originalCapsules: readonly Tile[];

  // ------------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------------

  /**
   * Parse a `.lay` format string into a fully usable Layout.
   *
   * @param text - The raw maze text. Lines are split on `\n` (trailing
   *   whitespace / empty lines are tolerated).
   */
  constructor(text: string) {
    const rows = text.split('\n').filter((line) => line.length > 0);

    this.height = rows.length;
    this.width = rows.reduce((max, row) => Math.max(max, row.length), 0);

    // Initialise 2D arrays [col][row] to false.
    this.walls = Layout._createGrid<boolean>(this.width, this.height, false);
    this.food = Layout._createGrid<boolean>(this.width, this.height, false);
    this._originalFood = Layout._createGrid<boolean>(this.width, this.height, false);

    this.capsules = [];
    this.ghostStarts = [];

    let pacman: Tile | null = null;
    let dotCount = 0;

    for (let row = 0; row < this.height; row++) {
      const line = rows[row];
      for (let col = 0; col < this.width; col++) {
        const ch = col < line.length ? line[col] : ' ';

        if (ch === WALL_CHAR) {
          this.walls[col][row] = true;
        } else if (ch === FOOD_CHAR) {
          this.food[col][row] = true;
          this._originalFood[col][row] = true;
          dotCount++;
        } else if (ch === CAPSULE_CHAR) {
          this.capsules.push({ col, row });
        } else if (ch === PACMAN_CHAR) {
          pacman = { col, row };
        } else if (GHOST_CHARS.has(ch)) {
          this.ghostStarts.push({ col, row });
        }
        // Space or any other character: empty floor, no food.
      }
    }

    this.totalDots = dotCount;

    // Snapshot original capsules for resetFood().
    this._originalCapsules = this.capsules.map((t) => ({ ...t }));

    // Fallback when the layout omits a Pacman marker.
    this.pacmanStart = pacman ?? defaultPacmanStart(this.width, this.height);
  }

  // ------------------------------------------------------------------
  // Static helpers
  // ------------------------------------------------------------------

  /**
   * Create a width x height 2D array filled with `value`.
   * Indexed as `grid[col][row]`.
   */
  private static _createGrid<T>(width: number, height: number, value: T): T[][] {
    const grid: T[][] = new Array(width);
    for (let col = 0; col < width; col++) {
      grid[col] = new Array<T>(height).fill(value);
    }
    return grid;
  }

  // ------------------------------------------------------------------
  // Spatial queries
  // ------------------------------------------------------------------

  /**
   * Returns `true` when the given tile coordinate is a wall.
   * Out-of-bounds tiles are treated as walls.
   */
  isWall(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return true;
    return this.walls[col][row];
  }

  /** Returns `true` when `(col, row)` lies within the grid dimensions. */
  isInBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.width && row >= 0 && row < this.height;
  }

  /**
   * Returns the four-directional (NSEW) neighbours of `tile` that are
   * in-bounds and not walls.
   */
  getOpenNeighbors(tile: Tile): Tile[] {
    const { col, row } = tile;
    const neighbors: Tile[] = [];

    const candidates: Tile[] = [
      { col, row: row - 1 }, // north
      { col, row: row + 1 }, // south
      { col: col + 1, row }, // east
      { col: col - 1, row }, // west
    ];

    for (const t of candidates) {
      if (this.isInBounds(t.col, t.row) && !this.walls[t.col][t.row]) {
        neighbors.push(t);
      }
    }

    return neighbors;
  }

  /**
   * Returns the pixel coordinates of the centre of the given tile.
   * Useful for rendering and collision detection.
   */
  tileCenter(tile: Tile): Vec2 {
    return {
      x: tile.col * TILE_SIZE + TILE_SIZE / 2,
      y: tile.row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  /**
   * Converts a pixel position to the tile that contains it.
   * Uses `Math.floor` so the top-left pixel of a tile maps to that tile.
   */
  pixelToTile(pos: Vec2): Tile {
    return {
      col: Math.floor(pos.x / TILE_SIZE),
      row: Math.floor(pos.y / TILE_SIZE),
    };
  }

  /**
   * Detects whether a tile is a tunnel entrance (the left- or right-most
   * column) and is passable (not a wall).
   *
   * Tunnel tiles allow entities to wrap around from one side of the maze
   * to the other.
   */
  isTunnel(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return false;
    return (col === 0 || col === this.width - 1) && !this.walls[col][row];
  }

  // ------------------------------------------------------------------
  // Food / capsule queries and mutations
  // ------------------------------------------------------------------

  /** Returns `true` when the tile currently contains an uneaten food dot. */
  hasFood(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return false;
    return this.food[col][row];
  }

  /**
   * Attempts to eat the food dot at `(col, row)`.
   *
   * @returns `true` if a dot was present and has now been consumed, `false`
   *   otherwise.
   */
  eatFood(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return false;
    if (!this.food[col][row]) return false;
    this.food[col][row] = false;
    return true;
  }

  /** Returns `true` when the tile currently holds a power capsule. */
  hasCapsule(col: number, row: number): boolean {
    return this.capsules.some((c) => c.col === col && c.row === row);
  }

  /**
   * Attempts to eat the power capsule at `(col, row)`.
   *
   * @returns `true` if a capsule was present and has now been consumed,
   *   `false` otherwise.
   */
  eatCapsule(col: number, row: number): boolean {
    const idx = this.capsules.findIndex((c) => c.col === col && c.row === row);
    if (idx === -1) return false;
    this.capsules.splice(idx, 1);
    return true;
  }

  /**
   * Restores all food dots and capsules to their original positions.
   * Called when advancing to a new level or restarting the game.
   */
  resetFood(): void {
    for (let col = 0; col < this.width; col++) {
      for (let row = 0; row < this.height; row++) {
        this.food[col][row] = this._originalFood[col][row];
      }
    }

    // Rebuild capsules from the original snapshot.
    this.capsules.length = 0;
    for (const cap of this._originalCapsules) {
      this.capsules.push({ col: cap.col, row: cap.row });
    }
  }

  // ------------------------------------------------------------------
  // Wall rendering helpers
  // ------------------------------------------------------------------

  /**
   * For a wall tile at `(col, row)`, returns which of its four cardinal
   * neighbours are also walls. Used by the renderer to decide which edges
   * to draw and how to shape neon glow outlines.
   *
   * If the queried tile is not itself a wall, all flags are `false`.
   */
  getWallConnections(col: number, row: number): WallConnections {
    if (!this.isWall(col, row)) {
      return { n: false, s: false, e: false, w: false };
    }

    return {
      n: this.isWall(col, row - 1),
      s: this.isWall(col, row + 1),
      e: this.isWall(col + 1, row),
      w: this.isWall(col - 1, row),
    };
  }
}
