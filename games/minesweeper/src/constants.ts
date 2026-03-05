import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { name: 'Beginner', cols: 9, rows: 9, mines: 10, cellSize: 36 },
  intermediate: { name: 'Intermediate', cols: 16, rows: 16, mines: 40, cellSize: 30 },
  expert: { name: 'Expert', cols: 30, rows: 16, mines: 99, cellSize: 24 },
};

export const HEADER_HEIGHT = 60;
export const PADDING = 16;

// Colors for numbers 1-8
export const NUMBER_COLORS: string[] = [
  '#2196F3', // 1 - blue
  '#4CAF50', // 2 - green
  '#f44336', // 3 - red
  '#9C27B0', // 4 - purple
  '#FF9800', // 5 - orange
  '#00BCD4', // 6 - cyan
  '#795548', // 7 - brown
  '#607D8B', // 8 - grey
];

export const BG = '#0a0a0a';
export const TILE_HIDDEN = '#2a2a3a';
export const TILE_REVEALED = '#1a1a2a';
export const TILE_HOVER = '#3a3a4a';
