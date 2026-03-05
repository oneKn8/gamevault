export const TILE_SIZE = 24;
export const TARGET_FPS = 60;
export const FIXED_DT = 1 / TARGET_FPS;
export const MAX_DT = 0.1;

// Speeds (tiles per second)
export const PACMAN_SPEED = 6;
export const GHOST_SPEED_BASE = 5;
export const GHOST_SPEED_FRIGHTENED = 2.5;
export const GHOST_SPEED_EATEN = 10;

// Timing (seconds)
export const SCARED_DURATION = 8;
export const SCARED_FLASH_START = 2;
export const DEATH_ANIM_DURATION = 1.2;
export const READY_DURATION = 2;
export const LEVEL_CLEAR_DURATION = 2;
export const INVULNERABLE_DURATION = 2;
export const RESPAWN_PAUSE = 0.5;

// Gameplay
export const INITIAL_LIVES = 3;
export const COLLISION_DIST = 0.7; // in tiles
export const DOT_SCORE = 10;
export const CAPSULE_SCORE = 50;
export const GHOST_BASE_SCORE = 200;
export const LEVEL_CLEAR_BONUS = 500;

// Ghost house release (dots eaten)
export const GHOST_RELEASE_DOTS = [0, 0, 30, 60];

// Scatter/Chase cycle durations (seconds)
export const SCATTER_CHASE_CYCLE = [
  { scatter: 7, chase: 20 },
  { scatter: 7, chase: 20 },
  { scatter: 5, chase: 20 },
  { scatter: 5, chase: Infinity },
];

// Colors
export const BG_COLOR = '#05050f';
export const WALL_COLOR = '#0066ff';
export const WALL_GLOW = '#3399ff';
export const WALL_INNER = '#0044aa';
export const WALL_FILL = '#060614';
export const DOT_COLOR = '#ffeedd';
export const DOT_GLOW = '#ffcc88';
export const CAPSULE_COLOR = '#ffffff';
export const CAPSULE_GLOW = '#ff88ff';
export const PACMAN_COLOR = '#ffe000';
export const PACMAN_COLOR_LIGHT = '#fff176';
export const PACMAN_GLOW = '#ffee55';
export const HUD_COLOR = '#e0e8ff';
export const HUD_LABEL = '#5577aa';
export const HUD_DIM = '#667799';

export const GHOST_COLORS: Record<string, { body: string; bodyLight: string; glow: string }> = {
  blinky: { body: '#ff1a1a', bodyLight: '#ff6655', glow: '#ff4444' },
  pinky: { body: '#ff77cc', bodyLight: '#ffaadd', glow: '#ff99dd' },
  inky: { body: '#00ddff', bodyLight: '#66eeff', glow: '#33eeff' },
  clyde: { body: '#ffaa33', bodyLight: '#ffcc77', glow: '#ffbb55' },
};

export const FRIGHTENED_COLOR = '#1a1aff';
export const FRIGHTENED_FLASH = '#ffffff';
