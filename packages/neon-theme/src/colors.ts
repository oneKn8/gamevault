// Core palette extracted from neon-pacman
export const colors = {
  // Background
  bg: '#05050f',
  bgLight: '#0a0a1a',
  bgCard: '#0d0d1f',

  // UI
  hudText: '#e0e8ff',
  hudLabel: '#5577aa',
  hudDim: '#667799',

  // Neon accents
  neonBlue: '#0066ff',
  neonBlueGlow: '#3399ff',
  neonBlueDark: '#0044aa',
  neonCyan: '#00ddff',
  neonCyanGlow: '#33eeff',
  neonPink: '#ff77cc',
  neonPinkGlow: '#ff99dd',
  neonYellow: '#ffe000',
  neonYellowLight: '#fff176',
  neonYellowGlow: '#ffee55',
  neonRed: '#ff1a1a',
  neonRedGlow: '#ff4444',
  neonOrange: '#ffaa33',
  neonOrangeGlow: '#ffbb55',
  neonGreen: '#33ff66',
  neonGreenGlow: '#66ff99',
  neonPurple: '#aa55ff',
  neonPurpleGlow: '#cc88ff',

  // Maze
  wallColor: '#0066ff',
  wallGlow: '#3399ff',
  wallInner: '#0044aa',
  wallFill: '#060614',

  // Food
  dotColor: '#ffeedd',
  dotGlow: '#ffcc88',
  capsuleColor: '#ffffff',
  capsuleGlow: '#ff88ff',

  // Ghost palette
  ghost: {
    blinky: { body: '#ff1a1a', light: '#ff6655', glow: '#ff4444' },
    pinky: { body: '#ff77cc', light: '#ffaadd', glow: '#ff99dd' },
    inky: { body: '#00ddff', light: '#66eeff', glow: '#33eeff' },
    clyde: { body: '#ffaa33', light: '#ffcc77', glow: '#ffbb55' },
  },

  // Special states
  frightened: '#1a1aff',
  frightenedFlash: '#ffffff',
} as const;

export type NeonColor = keyof typeof colors;
