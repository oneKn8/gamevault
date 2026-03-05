import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { name: 'Beginner', cols: 9, rows: 9, mines: 10, cellSize: 36 },
  intermediate: { name: 'Intermediate', cols: 16, rows: 16, mines: 40, cellSize: 30 },
  expert: { name: 'Expert', cols: 30, rows: 16, mines: 99, cellSize: 24 },
};

export const HEADER_HEIGHT = 64;
export const PADDING = 16;

// Colors for numbers 1-8 (classic Minesweeper palette)
export const NUMBER_COLORS: string[] = [
  '#1565C0', // 1 - blue
  '#2E7D32', // 2 - green
  '#C62828', // 3 - red
  '#6A1B9A', // 4 - purple
  '#E65100', // 5 - orange
  '#00838F', // 6 - cyan
  '#4E342E', // 7 - brown
  '#546E7A', // 8 - grey
];

// Classic Windows Minesweeper gray palette - no gradients
export const BG = '#bdbdbd';               // classic medium gray body
export const FIELD_BG = '#bdbdbd';         // game field background
export const HEADER_BG = '#bdbdbd';        // header bar background

export const TILE_HIDDEN = '#c0c0c0';      // unrevealed tile face
export const TILE_HOVER = '#cacaca';       // hover state - slightly lighter
export const TILE_REVEALED = '#bdbdbd';    // revealed (flat, slightly darker)

// Bevel colors for raised 3D effect
export const BEVEL_LIGHT = '#ffffff';      // top-left bright edge
export const BEVEL_MID = '#e0e0e0';        // inner highlight edge
export const BEVEL_DARK = '#808080';       // bottom-right dark shadow
export const BEVEL_DARKEST = '#404040';    // outermost bottom-right edge

// Header panel (sunken LCD display)
export const LCD_BG = '#1a1a1a';           // dark LCD background
export const LCD_MINE_COLOR = '#ff1a1a';   // bright red mine counter
export const LCD_TIMER_COLOR = '#00e676';  // green timer

// Mine tile highlight (exploded mine)
export const TILE_MINE_HIT = '#ff4444';    // the mine that was clicked - red bg
