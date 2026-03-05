export interface Vector2 {
  x: number;
  y: number;
}

export type Dimension = 'light' | 'shadow';

export interface PlayerState {
  id: string;
  position: Vector2;
  velocity: Vector2;
  dimension: Dimension;
  health: number;
  maxHealth: number;
  phaseDebt: number;
  phaseCooldown: number;
  attackCooldown: number;
  echo: EchoClone | null;
  score: number;
  color: string;
  username: string;
  alive: boolean;
  aimAngle: number;
  spawnShield: number;
}

export interface EchoClone {
  position: Vector2;
  dimension: Dimension;
  lifetime: number;
  maxLifetime: number;
  damageMultiplier: number;
  aimAngle: number;
}

export interface Anchor {
  id: number;
  position: Vector2;
  dimension: Dimension;
  owner: string | null;
  captureProgress: number;
  capturingPlayer: string | null;
  radius: number;
}

export interface RiftPortal {
  id: number;
  position: Vector2;
  radius: number;
  active: boolean;
  timer: number;
  cooldown: number;
}

export interface Projectile {
  id: number;
  position: Vector2;
  velocity: Vector2;
  dimension: Dimension;
  ownerId: string;
  damage: number;
  lifetime: number;
}

export interface ArenaState {
  players: Map<string, PlayerState>;
  anchors: Anchor[];
  portals: RiftPortal[];
  projectiles: Projectile[];
  tick: number;
  time: number;
  winner: string | null;
}

export interface InputState {
  moveX: number;
  moveY: number;
  aimAngle: number;
  phaseShift: boolean;
  attack: boolean;
}
