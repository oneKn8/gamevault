import type { Vector2, PlayerState, Projectile } from './types';
import {
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PLAYER_SPEED,
  PLAYER_RADIUS,
  PROJECTILE_RADIUS,
} from './constants';

export function movePlayer(player: PlayerState, input: { moveX: number; moveY: number }, dt: number): void {
  let dx = input.moveX;
  let dy = input.moveY;

  // Normalize diagonal movement
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }

  player.velocity.x = dx * PLAYER_SPEED;
  player.velocity.y = dy * PLAYER_SPEED;

  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;

  // Wall collision
  player.position.x = Math.max(PLAYER_RADIUS, Math.min(ARENA_WIDTH - PLAYER_RADIUS, player.position.x));
  player.position.y = Math.max(PLAYER_RADIUS, Math.min(ARENA_HEIGHT - PLAYER_RADIUS, player.position.y));
}

export function moveProjectile(proj: Projectile, dt: number): void {
  proj.position.x += proj.velocity.x * dt;
  proj.position.y += proj.velocity.y * dt;
  proj.lifetime -= dt;
}

export function circleCollision(a: Vector2, aRadius: number, b: Vector2, bRadius: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const minDist = aRadius + bRadius;
  return distSq < minDist * minDist;
}

export function isInRange(a: Vector2, b: Vector2, range: number): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < range * range;
}

export function isInArena(pos: Vector2): boolean {
  return pos.x >= 0 && pos.x <= ARENA_WIDTH && pos.y >= 0 && pos.y <= ARENA_HEIGHT;
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function projectileHitsPlayer(proj: Projectile, player: PlayerState): boolean {
  if (proj.ownerId === player.id) return false;
  if (proj.dimension !== player.dimension) return false;
  return circleCollision(proj.position, PROJECTILE_RADIUS, player.position, PLAYER_RADIUS);
}
