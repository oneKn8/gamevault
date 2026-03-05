import type { InputState, PlayerState, Anchor, RiftPortal, Projectile } from './types';

// Client -> Server
export type ClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; username: string; token?: string }
  | { type: 'INPUT'; input: InputState; seq: number }
  | { type: 'READY' }
  | { type: 'LEAVE' };

// Server -> Client
export type ServerMessage =
  | { type: 'ROOM_STATE'; players: SerializedPlayer[]; roomCode: string; phase: RoomPhase }
  | { type: 'GAME_START'; players: SerializedPlayer[]; anchors: SerializedAnchor[]; portals: SerializedPortal[]; yourId: string }
  | { type: 'STATE_SNAPSHOT'; tick: number; time: number; players: SerializedPlayer[]; anchors: SerializedAnchor[]; projectiles: SerializedProjectile[]; portals: SerializedPortal[]; lastProcessedInput: number }
  | { type: 'PLAYER_JOIN'; player: SerializedPlayer }
  | { type: 'PLAYER_LEAVE'; playerId: string }
  | { type: 'GAME_OVER'; winnerId: string; scores: Record<string, number> }
  | { type: 'ERROR'; message: string };

export type RoomPhase = 'waiting' | 'countdown' | 'playing' | 'finished';

export interface SerializedPlayer {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dimension: 'light' | 'shadow';
  health: number;
  maxHealth: number;
  phaseDebt: number;
  phaseCooldown: number;
  attackCooldown: number;
  score: number;
  color: string;
  username: string;
  alive: boolean;
  aimAngle: number;
  spawnShield: number;
  echoX?: number;
  echoY?: number;
  echoDim?: 'light' | 'shadow';
  echoLife?: number;
  echoMaxLife?: number;
  ready?: boolean;
}

export interface SerializedAnchor {
  id: number;
  x: number;
  y: number;
  dimension: 'light' | 'shadow';
  owner: string | null;
  captureProgress: number;
  capturingPlayer: string | null;
}

export interface SerializedPortal {
  id: number;
  x: number;
  y: number;
  radius: number;
  active: boolean;
  timer: number;
}

export interface SerializedProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dimension: 'light' | 'shadow';
  ownerId: string;
  damage: number;
  lifetime: number;
}

export function serializePlayer(p: PlayerState, ready?: boolean): SerializedPlayer {
  const sp: SerializedPlayer = {
    id: p.id,
    x: p.position.x,
    y: p.position.y,
    vx: p.velocity.x,
    vy: p.velocity.y,
    dimension: p.dimension,
    health: p.health,
    maxHealth: p.maxHealth,
    phaseDebt: p.phaseDebt,
    phaseCooldown: p.phaseCooldown,
    attackCooldown: p.attackCooldown,
    score: p.score,
    color: p.color,
    username: p.username,
    alive: p.alive,
    aimAngle: p.aimAngle,
    spawnShield: p.spawnShield,
  };
  if (p.echo) {
    sp.echoX = p.echo.position.x;
    sp.echoY = p.echo.position.y;
    sp.echoDim = p.echo.dimension;
    sp.echoLife = p.echo.lifetime;
    sp.echoMaxLife = p.echo.maxLifetime;
  }
  if (ready !== undefined) sp.ready = ready;
  return sp;
}

export function deserializePlayer(sp: SerializedPlayer): PlayerState {
  return {
    id: sp.id,
    position: { x: sp.x, y: sp.y },
    velocity: { x: sp.vx, y: sp.vy },
    dimension: sp.dimension,
    health: sp.health,
    maxHealth: sp.maxHealth,
    phaseDebt: sp.phaseDebt,
    phaseCooldown: sp.phaseCooldown,
    attackCooldown: sp.attackCooldown,
    echo: sp.echoX !== undefined ? {
      position: { x: sp.echoX!, y: sp.echoY! },
      dimension: sp.echoDim!,
      lifetime: sp.echoLife!,
      maxLifetime: sp.echoMaxLife!,
      damageMultiplier: 0.5,
      aimAngle: sp.aimAngle,
    } : null,
    score: sp.score,
    color: sp.color,
    username: sp.username,
    alive: sp.alive,
    aimAngle: sp.aimAngle,
    spawnShield: sp.spawnShield ?? 0,
  };
}
