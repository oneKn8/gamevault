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

// Colors
export const SNAKE_HEAD = '#00ff88';
export const SNAKE_BODY = '#00cc66';
export const FOOD = '#ff4488';
export const BG = '#0a0a0a';
export const GRID_LINE = '#111111';

// Tick timing (ms per movement tick)
export const BASE_SPEED = 150;
export const MIN_SPEED = 60;
