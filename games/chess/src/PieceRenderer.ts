import { colors } from '@gamevault/neon-theme/colors';
import { drawNeonText } from '@gamevault/neon-theme/canvas/text';
import { CELL_SIZE, LABEL_PADDING, coordsFromSquare } from './Board';
import type { Color, PieceSymbol, Square } from 'chess.js';

// Unicode chess piece symbols
const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

// White pieces = cyan, Black pieces = pink
const PIECE_COLORS: Record<Color, { fill: string; glow: string }> = {
  w: { fill: colors.neonCyan, glow: colors.neonCyanGlow },
  b: { fill: colors.neonPink, glow: colors.neonPinkGlow },
};

interface FadeAnimation {
  square: Square;
  alpha: number;
  color: Color;
  piece: PieceSymbol;
}

const fadeAnimations: FadeAnimation[] = [];

export function triggerCaptureFade(square: Square, color: Color, piece: PieceSymbol): void {
  fadeAnimations.push({ square, alpha: 1.0, color, piece });
}

export function updateFadeAnimations(dt: number): void {
  for (let i = fadeAnimations.length - 1; i >= 0; i--) {
    fadeAnimations[i].alpha -= dt * 4; // fade over ~250ms
    if (fadeAnimations[i].alpha <= 0) {
      fadeAnimations.splice(i, 1);
    }
  }
}

export function drawPieces(
  ctx: CanvasRenderingContext2D,
  board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][],
): void {
  const fontSize = Math.floor(CELL_SIZE * 0.7);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      const x = LABEL_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
      const y = LABEL_PADDING + row * CELL_SIZE + CELL_SIZE / 2;
      const symbol = PIECE_SYMBOLS[cell.color][cell.type];
      const c = PIECE_COLORS[cell.color];

      drawNeonText(ctx, symbol, x, y, c.fill, c.glow, fontSize, 'serif');
    }
  }

  // Render fade animations for captured pieces
  for (const anim of fadeAnimations) {
    const { col, row } = coordsFromSquare(anim.square);
    const x = LABEL_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
    const y = LABEL_PADDING + row * CELL_SIZE + CELL_SIZE / 2;
    const symbol = PIECE_SYMBOLS[anim.color][anim.piece];
    const c = PIECE_COLORS[anim.color];

    ctx.save();
    ctx.globalAlpha = anim.alpha;
    drawNeonText(ctx, symbol, x, y, c.fill, c.glow, fontSize, 'serif');
    ctx.restore();
  }
}
