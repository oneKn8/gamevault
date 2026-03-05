import { CELL_SIZE, LABEL_PADDING, coordsFromSquare } from './Board';
import type { Color, PieceSymbol, Square } from 'chess.js';

// SVG piece image paths
const PIECE_FILES: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: 'wK', q: 'wQ', r: 'wR', b: 'wB', n: 'wN', p: 'wP' },
  b: { k: 'bK', q: 'bQ', r: 'bR', b: 'bB', n: 'bN', p: 'bP' },
};

const pieceImages: Map<string, HTMLImageElement> = new Map();
let imagesLoaded = false;

export function loadPieceImages(): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const color of ['w', 'b'] as Color[]) {
    for (const piece of ['k', 'q', 'r', 'b', 'n', 'p'] as PieceSymbol[]) {
      const key = PIECE_FILES[color][piece];
      const img = new Image();
      const p = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // fallback gracefully
      });
      // SVGs are served from pieces/ directory relative to the HTML
      img.src = `pieces/${key}.svg`;
      pieceImages.set(key, img);
      promises.push(p);
    }
  }
  return Promise.all(promises).then(() => { imagesLoaded = true; });
}

interface FadeAnimation {
  square: Square;
  alpha: number;
  color: Color;
  piece: PieceSymbol;
}

interface MoveAnimation {
  color: Color;
  piece: PieceSymbol;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  duration: number;
  square: Square; // destination square (to skip in normal rendering)
}

const fadeAnimations: FadeAnimation[] = [];
let currentMoveAnim: MoveAnimation | null = null;

export function triggerCaptureFade(square: Square, color: Color, piece: PieceSymbol): void {
  fadeAnimations.push({ square, alpha: 1.0, color, piece });
}

export function triggerMoveAnimation(
  from: Square,
  to: Square,
  color: Color,
  piece: PieceSymbol,
): void {
  const fromCoords = coordsFromSquare(from);
  const toCoords = coordsFromSquare(to);
  currentMoveAnim = {
    color,
    piece,
    fromX: LABEL_PADDING + fromCoords.col * CELL_SIZE + CELL_SIZE / 2,
    fromY: LABEL_PADDING + fromCoords.row * CELL_SIZE + CELL_SIZE / 2,
    toX: LABEL_PADDING + toCoords.col * CELL_SIZE + CELL_SIZE / 2,
    toY: LABEL_PADDING + toCoords.row * CELL_SIZE + CELL_SIZE / 2,
    progress: 0,
    duration: 0.15,
    square: to,
  };
}

export function updateFadeAnimations(dt: number): void {
  for (let i = fadeAnimations.length - 1; i >= 0; i--) {
    fadeAnimations[i].alpha -= dt * 4;
    if (fadeAnimations[i].alpha <= 0) {
      fadeAnimations.splice(i, 1);
    }
  }

  if (currentMoveAnim) {
    currentMoveAnim.progress += dt / currentMoveAnim.duration;
    if (currentMoveAnim.progress >= 1) {
      currentMoveAnim = null;
    }
  }
}

function drawPieceImage(
  ctx: CanvasRenderingContext2D,
  color: Color,
  piece: PieceSymbol,
  x: number,
  y: number,
  size: number,
): void {
  const key = PIECE_FILES[color][piece];
  const img = pieceImages.get(key);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else {
    // Fallback to Unicode if image not loaded
    const symbols: Record<Color, Record<PieceSymbol, string>> = {
      w: { k: '\u2654', q: '\u2655', r: '\u2656', b: '\u2657', n: '\u2658', p: '\u2659' },
      b: { k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F' },
    };
    ctx.font = `${Math.floor(size * 0.85)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color === 'w' ? '#ffffff' : '#1a1a1a';
    ctx.strokeStyle = color === 'w' ? '#333333' : '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(symbols[color][piece], x, y);
    ctx.fillText(symbols[color][piece], x, y);
  }
}

export function drawPieces(
  ctx: CanvasRenderingContext2D,
  board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][],
): void {
  const pieceSize = Math.floor(CELL_SIZE * 0.85);

  // Determine which square is being animated (skip it in normal rendering)
  const animatingSquare = currentMoveAnim?.square ?? null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (!cell) continue;

      // Skip the piece at destination if it's being animated
      if (animatingSquare && cell.square === animatingSquare && currentMoveAnim) continue;

      const x = LABEL_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
      const y = LABEL_PADDING + row * CELL_SIZE + CELL_SIZE / 2;

      drawPieceImage(ctx, cell.color, cell.type, x, y, pieceSize);
    }
  }

  // Render move animation
  if (currentMoveAnim) {
    const a = currentMoveAnim;
    const t = Math.min(a.progress, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const x = a.fromX + (a.toX - a.fromX) * ease;
    const y = a.fromY + (a.toY - a.fromY) * ease;
    drawPieceImage(ctx, a.color, a.piece, x, y, pieceSize);
  }

  // Render fade animations for captured pieces
  for (const anim of fadeAnimations) {
    const { col, row } = coordsFromSquare(anim.square);
    const x = LABEL_PADDING + col * CELL_SIZE + CELL_SIZE / 2;
    const y = LABEL_PADDING + row * CELL_SIZE + CELL_SIZE / 2;

    ctx.save();
    ctx.globalAlpha = anim.alpha;
    drawPieceImage(ctx, anim.color, anim.piece, x, y, pieceSize);
    ctx.restore();
  }
}
