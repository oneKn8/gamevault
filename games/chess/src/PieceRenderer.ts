import { CELL_SIZE, LABEL_PADDING, coordsFromSquare } from './Board';
import type { Color, PieceSymbol, Square } from 'chess.js';

// Unicode chess piece symbols
const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
  b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
};

const PIECE_COLORS: Record<Color, { fill: string; stroke: string }> = {
  w: { fill: '#ffffff', stroke: '#333333' },
  b: { fill: '#1a1a1a', stroke: '#000000' },
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
    fadeAnimations[i].alpha -= dt * 4;
    if (fadeAnimations[i].alpha <= 0) {
      fadeAnimations.splice(i, 1);
    }
  }
}

function drawPieceText(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  x: number,
  y: number,
  fill: string,
  stroke: string,
  fontSize: number,
): void {
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.strokeText(symbol, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(symbol, x, y);
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

      drawPieceText(ctx, symbol, x, y, c.fill, c.stroke, fontSize);
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
    drawPieceText(ctx, symbol, x, y, c.fill, c.stroke, fontSize);
    ctx.restore();
  }
}
