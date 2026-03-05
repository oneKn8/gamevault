import type { Anchor, RiftPortal, PlayerState, ArenaState, Projectile, InputState } from './types';
import {
  ANCHOR_COUNT,
  ANCHOR_RADIUS,
  ANCHOR_CAPTURE_RANGE,
  ANCHOR_CAPTURE_SPEED,
  ANCHOR_SCORE_RATE,
  ANCHOR_POSITIONS,
  RIFT_PORTAL_COUNT,
  RIFT_PORTAL_RADIUS,
  RIFT_PORTAL_ACTIVE_DURATION,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  WIN_SCORE,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  ATTACK_COOLDOWN,
  PROJECTILE_SPEED,
  PROJECTILE_DAMAGE,
  PROJECTILE_LIFETIME,
  PLAYER_COLORS,
  RESPAWN_TIME,
} from './constants';
import { movePlayer, moveProjectile, projectileHitsPlayer, isInRange, isInArena } from './physics';
import {
  applyPhaseShift,
  updatePhaseDebt,
  checkPhaseDebtOverflow,
  updateEcho,
  updateCooldowns,
  updateRiftPortal,
  useRiftPortal,
} from './dimension';

let nextProjectileId = 0;

export function createAnchors(): Anchor[] {
  return ANCHOR_POSITIONS.slice(0, ANCHOR_COUNT).map((pos, i) => ({
    id: i,
    position: { ...pos },
    dimension: i % 2 === 0 ? 'light' as const : 'shadow' as const,
    owner: null,
    captureProgress: 0,
    capturingPlayer: null,
    radius: ANCHOR_RADIUS,
  }));
}

export function createPortals(): RiftPortal[] {
  const portals: RiftPortal[] = [];
  const positions = [
    { x: 200, y: 200 },
    { x: 1000, y: 200 },
    { x: 600, y: 1000 },
  ];
  for (let i = 0; i < RIFT_PORTAL_COUNT; i++) {
    portals.push({
      id: i,
      position: positions[i],
      radius: RIFT_PORTAL_RADIUS,
      active: true,
      timer: RIFT_PORTAL_ACTIVE_DURATION,
      cooldown: 0,
    });
  }
  return portals;
}

export function createPlayer(id: string, username: string, colorIndex: number): PlayerState {
  const spawnAngle = (colorIndex / 10) * Math.PI * 2;
  const spawnDist = 300;
  return {
    id,
    position: {
      x: ARENA_WIDTH / 2 + Math.cos(spawnAngle) * spawnDist,
      y: ARENA_HEIGHT / 2 + Math.sin(spawnAngle) * spawnDist,
    },
    velocity: { x: 0, y: 0 },
    dimension: 'light',
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    phaseDebt: 0,
    phaseCooldown: 0,
    attackCooldown: 0,
    echo: null,
    score: 0,
    color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
    username,
    alive: true,
    aimAngle: 0,
  };
}

export function createArenaState(): ArenaState {
  return {
    players: new Map(),
    anchors: createAnchors(),
    portals: createPortals(),
    projectiles: [],
    tick: 0,
    time: 0,
    winner: null,
  };
}

export function updateAnchor(anchor: Anchor, players: Map<string, PlayerState>, dt: number): void {
  let capturer: string | null = null;
  let capturerCount = 0;

  for (const [id, player] of players) {
    if (!player.alive) continue;
    if (player.dimension !== anchor.dimension) continue;
    if (isInRange(player.position, anchor.position, ANCHOR_CAPTURE_RANGE)) {
      capturer = id;
      capturerCount++;
    }
  }

  // Contested - no capture
  if (capturerCount > 1) {
    anchor.capturingPlayer = null;
    return;
  }

  if (capturerCount === 1 && capturer) {
    if (anchor.owner === capturer) {
      // Already own it
      anchor.captureProgress = 1;
      anchor.capturingPlayer = null;
      return;
    }
    anchor.capturingPlayer = capturer;
    if (anchor.owner !== null) {
      // Decapture first
      anchor.captureProgress -= ANCHOR_CAPTURE_SPEED * dt;
      if (anchor.captureProgress <= 0) {
        anchor.owner = null;
        anchor.captureProgress = 0;
      }
    } else {
      anchor.captureProgress += ANCHOR_CAPTURE_SPEED * dt;
      if (anchor.captureProgress >= 1) {
        anchor.owner = capturer;
        anchor.captureProgress = 1;
      }
    }
  } else {
    anchor.capturingPlayer = null;
    // Slowly decay unowned anchors
    if (anchor.owner === null && anchor.captureProgress > 0) {
      anchor.captureProgress = Math.max(0, anchor.captureProgress - ANCHOR_CAPTURE_SPEED * 0.3 * dt);
    }
  }
}

export function scoreFromAnchors(anchors: Anchor[], playerId: string, dt: number): number {
  let owned = 0;
  for (const anchor of anchors) {
    if (anchor.owner === playerId) owned++;
  }
  return owned * ANCHOR_SCORE_RATE * dt;
}

function fireProjectile(player: PlayerState, projectiles: Projectile[]): void {
  if (player.attackCooldown > 0 || !player.alive) return;
  player.attackCooldown = ATTACK_COOLDOWN;

  const proj: Projectile = {
    id: nextProjectileId++,
    position: {
      x: player.position.x + Math.cos(player.aimAngle) * (PLAYER_RADIUS + 8),
      y: player.position.y + Math.sin(player.aimAngle) * (PLAYER_RADIUS + 8),
    },
    velocity: {
      x: Math.cos(player.aimAngle) * PROJECTILE_SPEED,
      y: Math.sin(player.aimAngle) * PROJECTILE_SPEED,
    },
    dimension: player.dimension,
    ownerId: player.id,
    damage: PROJECTILE_DAMAGE,
    lifetime: PROJECTILE_LIFETIME,
  };
  projectiles.push(proj);
}

let respawnTimers: Map<string, number> = new Map();

export function simulateTick(state: ArenaState, inputs: Map<string, InputState>, dt: number): void {
  if (state.winner) return;

  state.tick++;
  state.time += dt;

  // Process inputs for each player
  for (const [id, player] of state.players) {
    const input = inputs.get(id);
    if (!input) continue;

    if (!player.alive) {
      // Handle respawn timer
      const timer = (respawnTimers.get(id) ?? 0) - dt;
      respawnTimers.set(id, timer);
      if (timer <= 0) {
        respawnPlayer(player);
        respawnTimers.delete(id);
      }
      continue;
    }

    // Movement
    player.aimAngle = input.aimAngle;
    movePlayer(player, input, dt);

    // Phase shift
    if (input.phaseShift) {
      applyPhaseShift(player);
    }

    // Attack
    if (input.attack) {
      fireProjectile(player, state.projectiles);
    }

    // Update cooldowns
    updateCooldowns(player, dt);

    // Phase debt
    updatePhaseDebt(player, dt);
    checkPhaseDebtOverflow(player);

    // Echo update
    updateEcho(player, dt);

    // Check rift portals
    for (const portal of state.portals) {
      if (portal.active && isInRange(player.position, portal.position, portal.radius + PLAYER_RADIUS)) {
        useRiftPortal(player, portal);
      }
    }

    // Score from anchors
    player.score += scoreFromAnchors(state.anchors, id, dt);

    // Win check
    if (player.score >= WIN_SCORE) {
      state.winner = id;
      return;
    }
  }

  // Update projectiles
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const proj = state.projectiles[i];
    moveProjectile(proj, dt);

    if (proj.lifetime <= 0 || !isInArena(proj.position)) {
      state.projectiles.splice(i, 1);
      continue;
    }

    // Hit detection
    for (const [, player] of state.players) {
      if (projectileHitsPlayer(proj, player)) {
        player.health -= proj.damage;
        state.projectiles.splice(i, 1);
        if (player.health <= 0) {
          player.alive = false;
          player.health = 0;
          respawnTimers.set(player.id, RESPAWN_TIME);
          // Award kill score
          const shooter = state.players.get(proj.ownerId);
          if (shooter) shooter.score += 5;
        }
        break;
      }
    }
  }

  // Update anchors
  for (const anchor of state.anchors) {
    updateAnchor(anchor, state.players, dt);
  }

  // Update portals
  for (const portal of state.portals) {
    updateRiftPortal(portal, dt);
  }
}

function respawnPlayer(player: PlayerState): void {
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnDist = 200 + Math.random() * 200;
  player.position.x = ARENA_WIDTH / 2 + Math.cos(spawnAngle) * spawnDist;
  player.position.y = ARENA_HEIGHT / 2 + Math.sin(spawnAngle) * spawnDist;
  player.health = PLAYER_MAX_HEALTH;
  player.alive = true;
  player.dimension = 'light';
  player.phaseDebt = 0;
  player.phaseCooldown = 0;
  player.attackCooldown = 0;
  player.echo = null;
}

export function resetRespawnTimers(): void {
  respawnTimers = new Map();
}
