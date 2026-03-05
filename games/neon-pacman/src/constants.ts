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

// Colors - modern clean palette
export const BG_COLOR = '#000000';
export const WALL_COLOR = '#2121de';
export const WALL_FILL = '#000010';
export const DOT_COLOR = '#ffb897';
export const CAPSULE_COLOR = '#ffffff';
export const CAPSULE_GLOW = '#ffb897';
export const PACMAN_COLOR = '#ffcc00';
export const PACMAN_COLOR_LIGHT = '#ffe066';
export const HUD_COLOR = '#ffffff';
export const HUD_LABEL = '#8888aa';
export const HUD_DIM = '#666688';

export const GHOST_COLORS: Record<string, { body: string; bodyLight: string }> = {
  blinky: { body: '#ff0000', bodyLight: '#ff6655' },
  pinky: { body: '#ffb8ff', bodyLight: '#ffddee' },
  inky: { body: '#00ffff', bodyLight: '#88ffff' },
  clyde: { body: '#ffb852', bodyLight: '#ffdd99' },
};

export const FRIGHTENED_COLOR = '#2121de';
export const FRIGHTENED_FLASH = '#ffffff';
