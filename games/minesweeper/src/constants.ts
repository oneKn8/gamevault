import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { name: 'Beginner', cols: 9, rows: 9, mines: 10, cellSize: 36 },
  intermediate: { name: 'Intermediate', cols: 16, rows: 16, mines: 40, cellSize: 30 },
  expert: { name: 'Expert', cols: 30, rows: 16, mines: 99, cellSize: 24 },
};

export const HEADER_HEIGHT = 60;
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

export const BG = '#e0e0e0';
export const TILE_HIDDEN = '#c8c8c8';
export const TILE_REVEALED = '#d6d6d6';
export const TILE_HOVER = '#d0d0d0';
