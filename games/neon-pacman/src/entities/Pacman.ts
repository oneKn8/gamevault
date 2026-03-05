import {
  Vec2,
  Tile,
  Direction,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTION,
} from '../types';
import { TILE_SIZE, PACMAN_SPEED } from '../constants';

/** Maximum length of the position trail kept for glow rendering. */
const TRAIL_LENGTH = 8;

/** How close (in pixels) to the tile center on the perpendicular axis before a turn is allowed. */
const TURN_THRESHOLD = TILE_SIZE * 0.4;

/** Mouth oscillation rate (radians per tile traveled). */
const MOUTH_RATE = Math.PI * 2;

/** Maximum mouth opening angle in radians. */
const MOUTH_MAX = Math.PI / 4;

/** Resting mouth angle when Pacman is stationary. */
const MOUTH_REST = Math.PI / 8;

/**
 * Pacman entity with sub-tile float movement and direction buffering.
 *
 * Position is stored in pixels (float). Movement advances by
 * `speed * TILE_SIZE * dt` pixels per update tick. Direction changes
 * are only permitted near tile centers so that Pacman always stays
 * aligned to the grid.
 */
export class Pacman {
  /** Current pixel position (center of the sprite). */
  pos: Vec2;

  /** Direction Pacman is currently moving. */
  dir: Direction;

  /** Buffered input direction applied at the next valid tile center. */
  nextDir: Direction;

  /** Movement speed in tiles per second. */
  speed: number;

  /** Current mouth opening angle (0 to PI/4), used by the renderer. */
  mouthAngle: number;

  /** Whether the mouth is opening (true) or closing (false). */
  mouthOpen: boolean;

  /** False after a death animation begins, until reset. */
  alive: boolean;

  /** True while Pacman cannot be killed (post-respawn grace period). */
  invulnerable: boolean;

  /** Seconds remaining on the invulnerability window. */
  invulnerableTimer: number;

  /** Last N pixel positions, most recent first, for glow trail rendering. */
  trail: Vec2[];

  /** Total distance traveled in tiles, drives mouth animation. */
  private distanceTraveled: number;

  /** Tile where Pacman spawns / respawns. */
  private readonly startTile: Tile;

  constructor(startTile: Tile) {
    this.startTile = startTile;
    this.pos = tileToPixelCenter(startTile);
    this.dir = Direction.NONE;
    this.nextDir = Direction.NONE;
    this.speed = PACMAN_SPEED;
    this.mouthAngle = MOUTH_REST;
    this.mouthOpen = true;
    this.alive = true;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.trail = [];
    this.distanceTraveled = 0;
  }

  /**
   * Advance Pacman by one fixed-timestep tick.
   *
   * Order of operations:
   * 1. Try to apply the buffered direction change.
   * 2. Move in the current direction (handles wall collisions).
   * 3. Update mouth animation.
   * 4. Record the position for the glow trail.
   * 5. Tick down the invulnerability timer.
   */
  update(dt: number, layout: Layout): void {
    if (!this.alive) return;

    this.tryTurn(layout);
    this.move(dt, layout);
    this.updateMouth(dt);
    this.updateTrail();
    this.updateInvulnerability(dt);
  }

  /** Return the tile that currently contains Pacman's center. */
  getTile(): Tile {
    return pixelToTile(this.pos);
  }

  /** Buffer a direction input. It will be applied at the next valid opportunity. */
  setNextDirection(dir: Direction): void {
    this.nextDir = dir;
  }

  /** Reset Pacman to the start tile, alive and stationary. */
  reset(): void {
    this.pos = tileToPixelCenter(this.startTile);
    this.dir = Direction.NONE;
    this.nextDir = Direction.NONE;
    this.speed = PACMAN_SPEED;
    this.mouthAngle = MOUTH_REST;
    this.mouthOpen = true;
    this.alive = true;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.trail = [];
    this.distanceTraveled = 0;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Check whether Pacman can turn in `dir` from the current position.
   *
   * Two conditions must be met:
   *  - Pacman is close enough to the tile center on the *perpendicular* axis
   *    (within `TURN_THRESHOLD` pixels).
   *  - The adjacent tile in direction `dir` is not a wall.
   */
  private canTurn(dir: Direction, layout: Layout): boolean {
    const tile = this.getTile();
    const center = tileToPixelCenter(tile);
    const vec = DIRECTION_VECTORS[dir];

    // Check perpendicular alignment. For horizontal turns we need vertical
    // alignment and vice-versa.
    if (vec.x !== 0) {
      // Turning horizontally: check vertical alignment.
      if (Math.abs(this.pos.y - center.y) > TURN_THRESHOLD) return false;
    } else if (vec.y !== 0) {
      // Turning vertically: check horizontal alignment.
      if (Math.abs(this.pos.x - center.x) > TURN_THRESHOLD) return false;
    }

    const nextCol = tile.col + vec.x;
    const nextRow = tile.row + vec.y;

    // Allow turning into out-of-bounds tiles for tunnel wrapping.
    if (!layout.isInBounds(nextCol, nextRow)) return true;

    return !layout.isWall(nextCol, nextRow);
  }

  /**
   * Try to apply the buffered `nextDir`.
   *
   * If `nextDir` is valid, snap the perpendicular axis to the tile center
   * (prevents drifting), commit the direction, and clear the buffer.
   */
  private tryTurn(layout: Layout): void {
    if (this.nextDir === Direction.NONE) return;
    if (!this.canTurn(this.nextDir, layout)) return;

    const tile = this.getTile();
    const center = tileToPixelCenter(tile);
    const vec = DIRECTION_VECTORS[this.nextDir];

    // Snap the perpendicular axis to prevent sub-pixel drift.
    if (vec.x !== 0) {
      this.pos.y = center.y;
    } else if (vec.y !== 0) {
      this.pos.x = center.x;
    }

    this.dir = this.nextDir;
    this.nextDir = Direction.NONE;
  }

  /**
   * Move Pacman in the current direction, handling wall collisions and
   * tunnel wrapping.
   */
  private move(dt: number, layout: Layout): void {
    if (this.dir === Direction.NONE) return;

    const vec = DIRECTION_VECTORS[this.dir];
    const movePixels = this.speed * TILE_SIZE * dt;

    const nextX = this.pos.x + vec.x * movePixels;
    const nextY = this.pos.y + vec.y * movePixels;

    // Determine the tile we would enter.
    const nextTile = pixelToTile({ x: nextX, y: nextY });

    // Check wall collision.
    if (layout.isInBounds(nextTile.col, nextTile.row) &&
        layout.isWall(nextTile.col, nextTile.row)) {
      // Snap to the edge of the current walkable tile.
      const currentTile = this.getTile();
      const center = tileToPixelCenter(currentTile);
      this.pos.x = center.x;
      this.pos.y = center.y;
      // Do not clear direction -- the player can still be holding a key.
      // But stop movement by not advancing position further.
      return;
    }

    // Apply movement.
    this.pos.x = nextX;
    this.pos.y = nextY;

    // Accumulate distance for mouth animation (in tile units).
    this.distanceTraveled += (movePixels / TILE_SIZE);

    // Tunnel wrapping.
    const worldWidth = layout.width * TILE_SIZE;
    if (this.pos.x < 0) {
      this.pos.x += worldWidth;
    } else if (this.pos.x >= worldWidth) {
      this.pos.x -= worldWidth;
    }
  }

  /** Oscillate the mouth angle based on distance traveled. */
  private updateMouth(_dt: number): void {
    if (this.dir === Direction.NONE) {
      // Stationary -- hold mouth partially open.
      this.mouthAngle = MOUTH_REST;
      this.mouthOpen = true;
      return;
    }

    // Use a sine wave keyed off distance traveled for smooth oscillation.
    const raw = Math.abs(Math.sin(this.distanceTraveled * MOUTH_RATE));
    this.mouthAngle = raw * MOUTH_MAX;
  }

  /** Push the current position onto the trail buffer (capped at TRAIL_LENGTH). */
  private updateTrail(): void {
    this.trail.unshift({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > TRAIL_LENGTH) {
      this.trail.length = TRAIL_LENGTH;
    }
  }

  /** Tick down the invulnerability timer. */
  private updateInvulnerability(dt: number): void {
    if (!this.invulnerable) return;
    this.invulnerableTimer -= dt;
    if (this.invulnerableTimer <= 0) {
      this.invulnerable = false;
      this.invulnerableTimer = 0;
    }
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
// Layout interface (structural typing -- no direct import needed)
// ---------------------------------------------------------------------------

/**
 * Minimal layout surface required by Pacman.
 *
 * This mirrors the public API of the full `Layout` class so that Pacman
 * can be tested in isolation with a lightweight stub.
 */
interface Layout {
  readonly width: number;
  readonly height: number;
  isWall(col: number, row: number): boolean;
  isInBounds(col: number, row: number): boolean;
}
