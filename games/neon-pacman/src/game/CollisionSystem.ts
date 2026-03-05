import { Vec2, Tile, GhostMode } from '../types';
import { TILE_SIZE, COLLISION_DIST } from '../constants';

// ---------------------------------------------------------------------------
// Structural interfaces -- decouple from concrete entity classes
// ---------------------------------------------------------------------------

/** Minimal Pacman surface consumed by collision checks. */
interface PacmanLike {
  readonly pos: Vec2;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  getTile(): Tile;
}

/** Minimal Ghost surface consumed by collision checks. */
interface GhostLike {
  readonly pos: Vec2;
  readonly mode: GhostMode;
}

/** Minimal Layout surface consumed by collision checks. */
interface LayoutLike {
  hasFood(col: number, row: number): boolean;
  eatFood(col: number, row: number): boolean;
  hasCapsule(col: number, row: number): boolean;
  eatCapsule(col: number, row: number): boolean;
  tileCenter(tile: Tile): Vec2;
}

/** Result of a ghost collision check. */
export interface GhostCollisionResult {
  /** Frightened ghosts that Pacman has eaten this frame. */
  eaten: GhostLike[];
  /** True if Pacman was killed by touching a dangerous (SCATTER/CHASE) ghost. */
  killed: boolean;
}

/**
 * Handles all collision detection between game entities.
 *
 * All distance checks are performed in pixel space, then converted to tile
 * units for comparison against {@link COLLISION_DIST}.
 */
export class CollisionSystem {
  // ---------------------------------------------------------------------------
  // Food
  // ---------------------------------------------------------------------------

  /**
   * Check whether Pacman is close enough to a food-dot tile center to eat it.
   *
   * The check uses a proximity threshold of half a tile-width so Pacman does
   * not need to be pixel-perfect.
   *
   * @returns The tile of eaten food, or `null` if nothing was eaten.
   */
  checkFoodEat(pacman: PacmanLike, layout: LayoutLike): Tile | null {
    const tile = pacman.getTile();

    if (!layout.hasFood(tile.col, tile.row)) return null;

    const center = layout.tileCenter(tile);
    const dx = pacman.pos.x - center.x;
    const dy = pacman.pos.y - center.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);

    if (distPx < TILE_SIZE * 0.5) {
      if (layout.eatFood(tile.col, tile.row)) {
        return tile;
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Capsule
  // ---------------------------------------------------------------------------

  /**
   * Check whether Pacman is close enough to a capsule tile center to eat it.
   *
   * Uses the same proximity threshold as food dots.
   *
   * @returns The tile of the eaten capsule, or `null`.
   */
  checkCapsuleEat(pacman: PacmanLike, layout: LayoutLike): Tile | null {
    const tile = pacman.getTile();

    if (!layout.hasCapsule(tile.col, tile.row)) return null;

    const center = layout.tileCenter(tile);
    const dx = pacman.pos.x - center.x;
    const dy = pacman.pos.y - center.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);

    if (distPx < TILE_SIZE * 0.5) {
      if (layout.eatCapsule(tile.col, tile.row)) {
        return tile;
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // Pacman <-> Ghost
  // ---------------------------------------------------------------------------

  /**
   * Check Pacman-Ghost collisions for all ghosts.
   *
   * Distance is measured as Euclidean distance in tile units (pixel distance
   * divided by TILE_SIZE).  A collision occurs when that distance is less
   * than {@link COLLISION_DIST}.
   *
   * Collision outcomes depend on ghost mode:
   * - **FRIGHTENED** -- the ghost is eaten by Pacman.
   * - **SCATTER / CHASE** -- Pacman is killed (unless invulnerable).
   * - **EATEN / HOUSE** -- no collision; ghosts in these modes are
   *   intangible.
   *
   * @returns An object with `eaten` (array of eaten ghosts) and `killed`
   *   (whether Pacman was killed).
   */
  checkGhostCollision(
    pacman: PacmanLike,
    ghosts: GhostLike[],
  ): GhostCollisionResult {
    const result: GhostCollisionResult = { eaten: [], killed: false };

    if (!pacman.alive) return result;

    for (const ghost of ghosts) {
      // Ghosts in EATEN or HOUSE mode are intangible.
      if (ghost.mode === GhostMode.EATEN || ghost.mode === GhostMode.HOUSE) {
        continue;
      }

      const dx = (pacman.pos.x - ghost.pos.x) / TILE_SIZE;
      const dy = (pacman.pos.y - ghost.pos.y) / TILE_SIZE;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= COLLISION_DIST) continue;

      if (ghost.mode === GhostMode.FRIGHTENED) {
        result.eaten.push(ghost);
      } else {
        // SCATTER or CHASE -- dangerous
        if (!pacman.invulnerable) {
          result.killed = true;
        }
      }
    }

    return result;
  }
}
