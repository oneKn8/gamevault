export interface Vec2 {
  x: number;
  y: number;
}

export interface Tile {
  col: number;
  row: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE',
}

export enum GamePhase {
  MENU = 'MENU',
  READY = 'READY',
  PLAYING = 'PLAYING',
  DYING = 'DYING',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
}

export enum GhostMode {
  SCATTER = 'SCATTER',
  CHASE = 'CHASE',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN',
  HOUSE = 'HOUSE',
}

export enum GameEvent {
  DOT_EATEN = 'DOT_EATEN',
  CAPSULE_EATEN = 'CAPSULE_EATEN',
  GHOST_EATEN = 'GHOST_EATEN',
  PACMAN_DIED = 'PACMAN_DIED',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  GAME_OVER = 'GAME_OVER',
  COMBO_EXTENDED = 'COMBO_EXTENDED',
  FRUIT_EATEN = 'FRUIT_EATEN',
  POWER_UP_COLLECTED = 'POWER_UP_COLLECTED',
  POWER_UP_EXPIRED = 'POWER_UP_EXPIRED',
}

export const DIRECTION_VECTORS: Record<Direction, Vec2> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.NONE]: { x: 0, y: 0 },
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
  [Direction.NONE]: Direction.NONE,
};
