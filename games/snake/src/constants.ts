// Grid dimensions (in cells)
export const GRID_W = 20;
export const GRID_H = 20;

// Cell size in logical pixels
export const CELL = 24;

// HUD bar height at the top
export const HUD_HEIGHT = 50;

// Canvas logical dimensions
export const CANVAS_WIDTH = GRID_W * CELL;
export const CANVAS_HEIGHT = GRID_H * CELL + HUD_HEIGHT;

// Colors -- rich detailed palette
export const SNAKE_HEAD = '#4caf50';
export const SNAKE_BODY = '#388e3c';
export const SNAKE_BELLY = '#66bb6a';
export const FOOD = '#d32f2f';
export const FOOD_HIGHLIGHT = '#ef5350';
export const FOOD_STEM = '#5d4037';
export const FOOD_LEAF = '#2e7d32';

// Checkerboard field
export const FIELD_LIGHT = '#aad751';
export const FIELD_DARK = '#a2d149';
export const FIELD_BORDER = '#578a34';

// HUD
export const HUD_BG = '#4a752c';
export const HUD_TEXT = '#ffffff';
export const HUD_LABEL = '#c8e6a0';

// Tick timing (ms per movement tick)
export const BASE_SPEED = 150;
export const MIN_SPEED = 60;
