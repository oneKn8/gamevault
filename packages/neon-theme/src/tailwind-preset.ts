import { colors } from './colors';

export const neonPreset = {
  theme: {
    extend: {
      colors: {
        neon: {
          bg: colors.bg,
          'bg-light': colors.bgLight,
          'bg-card': colors.bgCard,
          blue: colors.neonBlue,
          'blue-glow': colors.neonBlueGlow,
          cyan: colors.neonCyan,
          'cyan-glow': colors.neonCyanGlow,
          pink: colors.neonPink,
          'pink-glow': colors.neonPinkGlow,
          yellow: colors.neonYellow,
          'yellow-glow': colors.neonYellowGlow,
          red: colors.neonRed,
          'red-glow': colors.neonRedGlow,
          orange: colors.neonOrange,
          green: colors.neonGreen,
          purple: colors.neonPurple,
        },
        hud: {
          text: colors.hudText,
          label: colors.hudLabel,
          dim: colors.hudDim,
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        retro: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        'neon-blue': `0 0 10px ${colors.neonBlue}, 0 0 40px ${colors.neonBlueGlow}40`,
        'neon-cyan': `0 0 10px ${colors.neonCyan}, 0 0 40px ${colors.neonCyanGlow}40`,
        'neon-pink': `0 0 10px ${colors.neonPink}, 0 0 40px ${colors.neonPinkGlow}40`,
        'neon-yellow': `0 0 10px ${colors.neonYellow}, 0 0 40px ${colors.neonYellowGlow}40`,
        'neon-green': `0 0 10px ${colors.neonGreen}, 0 0 40px ${colors.neonGreenGlow}40`,
        'neon-purple': `0 0 10px ${colors.neonPurple}, 0 0 40px ${colors.neonPurpleGlow}40`,
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.3' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.5' },
          '97%': { opacity: '1' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
} as const;
