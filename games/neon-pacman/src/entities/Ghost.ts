import {
  Vec2,
  Tile,
  Direction,
  GhostMode,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTION,
} from '../types';
import {
  TILE_SIZE,
  GHOST_SPEED_BASE,
  GHOST_SPEED_FRIGHTENED,
  GHOST_SPEED_EATEN,
} from '../constants';

/** Pixel distance threshold for considering the ghost "at" a tile center. */
const TILE_CENTER_THRESHOLD = 3;

/**
 * Tie-breaking priority when two neighbor tiles are equidistant from the
 * target. Matches the original arcade order: UP > LEFT > DOWN > RIGHT.
 */
const DIRECTION_PRIORITY: readonly Direction[] = [
  Direction.UP,
  Direction.LEFT,
  Direction.DOWN,
  Direction.RIGHT,
];

/**
 * Base ghost entity with a finite-state machine for
 * scatter / chase / frightened / eaten / house modes.
 *
 * In Phase 1 every ghost uses the base `getTargetTile()` which simply
 * returns `scatterTarget`. Subclasses (Blinky, Pinky, Inky, Clyde) will
 * override `getTargetTile()` in Phase 2 to implement unique chase
 * behaviors.
 *
 * Position is stored in pixels (float), consistent with Pacman.
 */
export class Ghost {
  /** Current pixel position (center of the sprite). */
  pos: Vec2;

  /** Direction the ghost is currently traveling. */
  dir: Direction;

  /** Active behavior mode. */
  mode: GhostMode;

  /** Mode that was active before entering FRIGHTENED (restored when fright ends). */
  prevMode: GhostMode;

  /** Current speed in tiles per second. */
  speed: number;

  /** Seconds remaining in FRIGHTENED mode. */
  frightenedTimer: number;

  /** Display / identity name (e.g. "blinky"). */
  readonly name: string;

  /** Tile where this ghost spawns inside the ghost house. */
  readonly startTile: Tile;

  /** Corner tile targeted during SCATTER mode. */
  readonly scatterTarget: Tile;

  /** Whether this ghost has been released from the ghost house. */
  released: boolean;

  /** Seconds spent waiting inside the ghost house (unused once released). */
  houseTimer: number;

  /** Tile the ghost is heading toward when in EATEN mode. */
  private eatenTarget: Tile;

  /**
   * Flag set to true when the ghost reaches the center of a new tile and
   * has not yet chosen a new direction for that tile. Prevents re-evaluation
   * on subsequent frames while the ghost is still crossing the same center.
   */
  private lastDecisionTile: Tile;

  constructor(name: string, startTile: Tile, scatterTarget: Tile) {
    this.name = name;
    this.startTile = startTile;
    this.scatterTarget = scatterTarget;

    this.pos = tileToPixelCenter(startTile);
    this.dir = Direction.UP;
    this.mode = GhostMode.HOUSE;
    this.prevMode = GhostMode.SCATTER;
    this.speed = 0;
    this.frightenedTimer = 0;
    this.released = false;
    this.houseTimer = 0;
    this.eatenTarget = startTile;
    this.lastDecisionTile = { col: -1, row: -1 };
  }

  /**
   * Advance the ghost by one fixed-timestep tick.
   *
   * @param dt        Fixed delta time in seconds.
   * @param layout    The maze layout (walls, bounds, neighbors).
   * @param pacmanTile  Pacman's current tile (used for chase targeting).
   * @param pacmanDir   Pacman's current direction (used by some chase AI).
   */
  update(
    dt: number,
    layout: Layout,
    pacmanTile: Tile,
    pacmanDir: Direction,
  ): void {
    // ---- HOUSE: stationary until released ----
    if (this.mode === GhostMode.HOUSE) {
      this.houseTimer += dt;
      // Actual release is triggered externally via release().
      return;
    }

    // ---- FRIGHTENED timer ----
    if (this.mode === GhostMode.FRIGHTENED) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        this.mode = this.prevMode;
        this.speed = GHOST_SPEED_BASE;
      }
    }

    // ---- Choose direction at tile center ----
    if (this.isAtTileCenter()) {
      const currentTile = this.getTile();

      // Only make a decision once per tile.
      if (
        currentTile.col !== this.lastDecisionTile.col ||
        currentTile.row !== this.lastDecisionTile.row
      ) {
        this.lastDecisionTile = { col: currentTile.col, row: currentTile.row };

        // Snap to exact tile center to prevent drift.
        const center = tileToPixelCenter(currentTile);
        this.pos.x = center.x;
        this.pos.y = center.y;

        // ---- EATEN: check if we've arrived at the ghost house ----
        if (this.mode === GhostMode.EATEN) {
          if (
            currentTile.col === this.eatenTarget.col &&
            currentTile.row === this.eatenTarget.row
          ) {
            // Re-enter the house; will be re-released immediately.
            this.mode = this.prevMode;
            this.speed = GHOST_SPEED_BASE;
          }
        }

        // Determine target tile based on mode.
        const target = this.resolveTarget(pacmanTile, pacmanDir);

        // Pick next direction.
        this.dir = this.chooseDirectionAtIntersection(layout, target);
      }
    }

    // ---- Move ----
    this.move(dt, layout);
  }

  /** Return the tile that currently contains the ghost's center. */
  getTile(): Tile {
    return pixelToTile(this.pos);
  }

  /**
   * Determine the target tile for the current mode.
   *
   * Override `getTargetTile` in subclasses to implement unique chase AI.
   */
  getTargetTile(
    pacmanTile: Tile,
    pacmanDir: Direction,
    _blinkyTile?: Tile,
  ): Tile {
    switch (this.name) {
      // Blinky (red): directly targets Pacman's current tile.
      case 'blinky':
        return pacmanTile;

      // Pinky (pink): targets 4 tiles ahead of Pacman in his current direction.
      case 'pinky': {
        const vec = DIRECTION_VECTORS[pacmanDir];
        return {
          col: pacmanTile.col + vec.x * 4,
          row: pacmanTile.row + vec.y * 4,
        };
      }

      // Inky (cyan): simplified -- targets Pacman's tile directly.
      // Full Inky AI requires Blinky's position and a vector doubling trick;
      // that will be implemented when Phase 2 subclasses land.
      case 'inky':
        return pacmanTile;

      // Clyde (orange): targets Pacman when far away (>8 tiles), retreats to
      // scatter corner when within 8 tiles.
      case 'clyde': {
        const currentTile = this.getTile();
        const dx = currentTile.col - pacmanTile.col;
        const dy = currentTile.row - pacmanTile.row;
        const distSq = dx * dx + dy * dy;
        // 8 tiles squared = 64
        return distSq > 64 ? pacmanTile : this.scatterTarget;
      }

      // Unknown ghost name: fall back to scatter corner.
      default:
        return this.scatterTarget;
    }
  }

  /**
   * Transition into FRIGHTENED mode.
   *
   * Saves the current mode so it can be restored once the timer expires.
   * Ghosts that are already EATEN are unaffected.
   *
   * @param duration Fright duration in seconds.
   */
  enterFrightened(duration: number): void {
    if (this.mode === GhostMode.EATEN) return;
    if (this.mode === GhostMode.HOUSE) return;

    if (this.mode !== GhostMode.FRIGHTENED) {
      this.prevMode = this.mode;
    }
    this.mode = GhostMode.FRIGHTENED;
    this.frightenedTimer = duration;
    this.speed = GHOST_SPEED_FRIGHTENED;

    // Ghosts immediately reverse direction when frightened.
    this.dir = OPPOSITE_DIRECTION[this.dir];
    // Reset decision tile so the ghost re-evaluates at the next center.
    this.lastDecisionTile = { col: -1, row: -1 };
  }

  /**
   * Transition into EATEN mode (eyes heading back to the ghost house).
   *
   * @param ghostHouseTile Tile above the ghost house entrance.
   */
  enterEaten(ghostHouseTile: Tile): void {
    this.prevMode =
      this.prevMode === GhostMode.FRIGHTENED
        ? GhostMode.SCATTER
        : this.prevMode;
    this.mode = GhostMode.EATEN;
    this.speed = GHOST_SPEED_EATEN;
    this.eatenTarget = ghostHouseTile;
    this.lastDecisionTile = { col: -1, row: -1 };
  }

  /** Release this ghost from the house into SCATTER mode. */
  release(): void {
    this.released = true;
    this.mode = GhostMode.SCATTER;
    this.speed = GHOST_SPEED_BASE;
    this.lastDecisionTile = { col: -1, row: -1 };
  }

  /** Reset the ghost to its initial state (start of level / after death). */
  reset(): void {
    this.pos = tileToPixelCenter(this.startTile);
    this.dir = Direction.UP;
    this.mode = GhostMode.HOUSE;
    this.prevMode = GhostMode.SCATTER;
    this.speed = 0;
    this.frightenedTimer = 0;
    this.released = false;
    this.houseTimer = 0;
    this.eatenTarget = this.startTile;
    this.lastDecisionTile = { col: -1, row: -1 };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Determine the target tile for the current mode.
   *
   * Delegates to `getTargetTile` for CHASE and returns fixed targets
   * for SCATTER, EATEN, and FRIGHTENED (FRIGHTENED chooses randomly so
   * the target is irrelevant -- it is handled inside
   * `chooseDirectionAtIntersection`).
   */
  private resolveTarget(pacmanTile: Tile, pacmanDir: Direction): Tile {
    switch (this.mode) {
      case GhostMode.SCATTER:
        return this.scatterTarget;
      case GhostMode.CHASE:
        return this.getTargetTile(pacmanTile, pacmanDir);
      case GhostMode.EATEN:
        return this.eatenTarget;
      case GhostMode.FRIGHTENED:
        // Target is unused; direction is chosen randomly.
        return this.scatterTarget;
      default:
        return this.scatterTarget;
    }
  }

  /**
   * At an intersection, choose the direction whose neighbor tile is closest
   * (Euclidean) to the `target` tile.
   *
   * Rules:
   * - The reverse of the current direction is excluded (ghosts never
   *   U-turn at intersections) unless it is the only option.
   * - In FRIGHTENED mode a random valid direction is chosen instead.
   * - Ties are broken in priority order: UP > LEFT > DOWN > RIGHT.
   */
  private chooseDirectionAtIntersection(
    layout: Layout,
    target: Tile,
  ): Direction {
    const currentTile = this.getTile();
    const reverse = OPPOSITE_DIRECTION[this.dir];

    // Build list of candidate directions (non-wall, non-reverse).
    const candidates: Direction[] = [];

    for (const dir of DIRECTION_PRIORITY) {
      const vec = DIRECTION_VECTORS[dir];
      const neighborCol = currentTile.col + vec.x;
      const neighborRow = currentTile.row + vec.y;

      // Allow moving into out-of-bounds tiles (tunnel exits).
      const blocked =
        layout.isInBounds(neighborCol, neighborRow) &&
        layout.isWall(neighborCol, neighborRow);

      if (blocked) continue;
      if (dir === reverse) continue;

      candidates.push(dir);
    }

    // Fallback: if no candidates remain, allow the reverse direction.
    if (candidates.length === 0) {
      candidates.push(reverse);
    }

    // FRIGHTENED: pick a random valid direction.
    if (this.mode === GhostMode.FRIGHTENED) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // SCATTER / CHASE / EATEN: pick the direction with the smallest
    // Euclidean distance from the neighbor tile to the target tile.
    let bestDir = candidates[0];
    let bestDist = Infinity;

    for (const dir of candidates) {
      const vec = DIRECTION_VECTORS[dir];
      const nCol = currentTile.col + vec.x;
      const nRow = currentTile.row + vec.y;

      const dx = nCol - target.col;
      const dy = nRow - target.row;
      const dist = dx * dx + dy * dy; // Squared is fine for comparison.

      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
      // Ties are broken by DIRECTION_PRIORITY order because we iterate
      // in that order and only update on strict `<`.
    }

    return bestDir;
  }

  /**
   * Advance the ghost's pixel position in the current direction.
   *
   * Handles wall collisions (snap to tile center) and horizontal
   * tunnel wrapping.
   */
  private move(dt: number, layout: Layout): void {
    if (this.dir === Direction.NONE) return;

    const vec = DIRECTION_VECTORS[this.dir];
    const movePixels = this.speed * TILE_SIZE * dt;

    const nextX = this.pos.x + vec.x * movePixels;
    const nextY = this.pos.y + vec.y * movePixels;

    const nextTile = pixelToTile({ x: nextX, y: nextY });

    // Wall collision check.
    if (
      layout.isInBounds(nextTile.col, nextTile.row) &&
      layout.isWall(nextTile.col, nextTile.row)
    ) {
      const currentTile = this.getTile();
      const center = tileToPixelCenter(currentTile);
      this.pos.x = center.x;
      this.pos.y = center.y;
      return;
    }

    this.pos.x = nextX;
    this.pos.y = nextY;

    // Tunnel wrapping (horizontal).
    const worldWidth = layout.width * TILE_SIZE;
    if (this.pos.x < 0) {
      this.pos.x += worldWidth;
    } else if (this.pos.x >= worldWidth) {
      this.pos.x -= worldWidth;
    }
  }

  /**
   * Check whether the ghost's pixel position is within `TILE_CENTER_THRESHOLD`
   * pixels of the center of the tile it occupies.
   */
  private isAtTileCenter(): boolean {
    const tile = this.getTile();
    const center = tileToPixelCenter(tile);
    return (
      Math.abs(this.pos.x - center.x) < TILE_CENTER_THRESHOLD &&
      Math.abs(this.pos.y - center.y) < TILE_CENTER_THRESHOLD
    );
  }
}

// ---------------------------------------------------------------------------
// Module-private coordinate helpers
// ---------------------------------------------------------------------------

/** Convert a tile coordinate to the pixel position of that tile's center. */
function tileToPixelCenter(tile: Tile): Vec2 {
  return {
    x: tile.col * TILE_SIZE + TILE_SIZE / 2,
    y: tile.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

/** Convert a pixel position to the tile that contains it. */
function pixelToTile(pos: Vec2): Tile {
  return {
    col: Math.floor(pos.x / TILE_SIZE),
    row: Math.floor(pos.y / TILE_SIZE),
  };
}

// ---------------------------------------------------------------------------
// Layout interface (structural typing)
// ---------------------------------------------------------------------------

/**
 * Minimal layout surface required by Ghost.
 *
 * Mirrors the public API of the full `Layout` class so that Ghost
 * can be tested in isolation with a lightweight stub.
 */
interface Layout {
  readonly width: number;
  readonly height: number;
  isWall(col: number, row: number): boolean;
  isInBounds(col: number, row: number): boolean;
}
