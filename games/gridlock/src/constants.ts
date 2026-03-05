import type { GameSettings } from './types';

// Player colors (Three.js hex)
export const PLAYER_COLORS = [0x3b82f6, 0xef4444, 0x22c55e, 0xa855f7] as const;

// Player colors (CSS hex strings)
export const PLAYER_CSS_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#a855f7'] as const;
export const PLAYER_NAMES = ['Blue', 'Red', 'Green', 'Purple'] as const;

// Board colors
export const NEUTRAL_COLOR = 0x4a4a58;
export const OBSTACLE_COLOR = 0x2a2a35;
export const BOARD_PLATFORM_COLOR = 0x35354a;
export const BACKGROUND_COLOR = 0x1e1e2e;
export const GRID_LINE_COLOR = 0x6a6a78;

// CSS colors
export const NEUTRAL_CSS = '#4a4a58';
export const BACKGROUND_CSS = '#1e1e2e';

// Tile dimensions
export const TILE_SIZE = 0.92;
export const TILE_HEIGHT = 0.18;
export const TILE_GAP = 1.0; // center-to-center spacing
export const OBSTACLE_HEIGHT = 0.50;
export const TILE_LIFT = 0.04;

// Piece dimensions
export const PIECE_BASE_TOP_RADIUS = 0.22;
export const PIECE_BASE_BOTTOM_RADIUS = 0.26;
export const PIECE_BASE_HEIGHT = 0.12;
export const PIECE_BODY_TOP_RADIUS = 0.16;
export const PIECE_BODY_BOTTOM_RADIUS = 0.20;
export const PIECE_BODY_HEIGHT = 0.38;
export const PIECE_CAP_RADIUS = 0.16;
export const PIECE_SEGMENTS = 6; // hexagonal

// Arrow dimensions
export const ARROW_SHAFT_WIDTH = 0.06;
export const ARROW_SHAFT_LENGTH = 0.3;
export const ARROW_HEAD_RADIUS = 0.12;
export const ARROW_HEAD_HEIGHT = 0.2;

// Animation durations (ms)
export const PIECE_MOVE_DURATION = 400;
export const PIECE_DEATH_DURATION = 500;
export const TILE_CAPTURE_DURATION = 120;
export const TILE_CAPTURE_MAX_WAVE = 500;
export const TILE_LIFT_DURATION = 150;
export const COLLISION_PARTICLE_LIFETIME = 800;
export const CAPTURE_PARTICLE_LIFETIME = 400;
export const VICTORY_PARTICLE_LIFETIME = 2000;
export const CAMERA_SHAKE_DURATION = 300;
export const ARROW_FADE_DURATION = 200;
export const REVEAL_PAUSE_DURATION = 1200;

// Particle counts
export const MAX_PARTICLES = 800;
export const COLLISION_PARTICLE_COUNT = 60;
export const CAPTURE_PARTICLE_COUNT = 12;
export const VICTORY_PARTICLE_COUNT = 200;

// Camera
export const CAMERA_FOV = 40;
export const CAMERA_TILT_ANGLE = 55; // degrees from horizontal
export const CAMERA_MARGIN_FACTOR = 1.4;
export const CAMERA_BREATHE_AMPLITUDE = 0.15;
export const CAMERA_BREATHE_FREQ = 0.3; // Hz

// Lighting
export const AMBIENT_INTENSITY = 0.65;
export const KEY_LIGHT_INTENSITY = 0.7;
export const FILL_LIGHT_INTENSITY = 0.25;

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 8,
  piecesPerPlayer: 1,
  aiCount: 2,
  aiDifficulty: 'medium',
  obstacles: 4,
  winTarget: 60,
  planTimer: 0,
};

// Settings options
export const GRID_SIZE_OPTIONS = [6, 8, 10, 12] as const;
export const PIECES_OPTIONS = [1, 2, 3, 4] as const;
export const AI_COUNT_OPTIONS = [1, 2, 3] as const;
export const AI_DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;
export const OBSTACLE_OPTIONS = [0, 4, 8, 12] as const;
export const WIN_TARGET_OPTIONS = [50, 60, 70, 75] as const;
export const PLAN_TIMER_OPTIONS = [0, 10, 15, 30] as const;
