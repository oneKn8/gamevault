import type { PlayerState, EchoClone, RiftPortal } from './types';
import {
  PHASE_SHIFT_COOLDOWN,
  ECHO_DURATION,
  ECHO_DAMAGE_MULTIPLIER,
  PHASE_DEBT_RATE,
  PHASE_DEBT_MAX,
  PHASE_DEBT_DRAIN_RATE,
  PHASE_DEBT_OVERFLOW_DAMAGE,
  RIFT_PORTAL_ACTIVE_DURATION,
  RIFT_PORTAL_COOLDOWN,
} from './constants';

export function canPhaseShift(player: PlayerState): boolean {
  return player.phaseCooldown <= 0 && player.alive;
}

export function applyPhaseShift(player: PlayerState): EchoClone | null {
  if (!canPhaseShift(player)) return null;

  // Create echo at current position in current dimension
  const echo: EchoClone = {
    position: { x: player.position.x, y: player.position.y },
    dimension: player.dimension,
    lifetime: ECHO_DURATION,
    maxLifetime: ECHO_DURATION,
    damageMultiplier: ECHO_DAMAGE_MULTIPLIER,
    aimAngle: player.aimAngle,
  };

  // Shift dimension
  player.dimension = player.dimension === 'light' ? 'shadow' : 'light';
  player.phaseCooldown = PHASE_SHIFT_COOLDOWN;
  player.echo = echo;

  return echo;
}

export function updatePhaseDebt(player: PlayerState, dt: number): void {
  if (player.dimension === 'shadow') {
    player.phaseDebt += PHASE_DEBT_RATE * dt;
  } else {
    player.phaseDebt = Math.max(0, player.phaseDebt - PHASE_DEBT_DRAIN_RATE * dt);
  }
}

export function checkPhaseDebtOverflow(player: PlayerState): boolean {
  if (player.phaseDebt >= PHASE_DEBT_MAX) {
    player.health -= PHASE_DEBT_OVERFLOW_DAMAGE;
    player.dimension = 'light';
    player.phaseDebt = PHASE_DEBT_MAX * 0.5;
    return true;
  }
  return false;
}

export function updateEcho(player: PlayerState, dt: number): void {
  if (!player.echo) return;
  player.echo.lifetime -= dt;
  if (player.echo.lifetime <= 0) {
    player.echo = null;
  }
}

export function updateCooldowns(player: PlayerState, dt: number): void {
  if (player.phaseCooldown > 0) {
    player.phaseCooldown = Math.max(0, player.phaseCooldown - dt);
  }
  if (player.attackCooldown > 0) {
    player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  }
}

export function updateRiftPortal(portal: RiftPortal, dt: number): void {
  portal.timer -= dt;
  if (portal.active) {
    if (portal.timer <= 0) {
      portal.active = false;
      portal.timer = RIFT_PORTAL_COOLDOWN;
    }
  } else {
    if (portal.timer <= 0) {
      portal.active = true;
      portal.timer = RIFT_PORTAL_ACTIVE_DURATION;
    }
  }
}

export function useRiftPortal(player: PlayerState, portal: RiftPortal): boolean {
  if (!portal.active) return false;
  player.dimension = player.dimension === 'light' ? 'shadow' : 'light';
  // No cooldown penalty when using portals
  return true;
}
