import { colors } from '@gamevault/neon-theme/colors';
import { drawGlowRect } from '@gamevault/neon-theme/canvas/glow';
import { drawNeonText } from '@gamevault/neon-theme/canvas/text';
import type { Square } from 'chess.js';

export const CELL_SIZE = 64;
export const BOARD_SIZE = CELL_SIZE * 8; // 512
export const LABEL_PADDING = 28;
export const CANVAS_WIDTH = BOARD_SIZE + LABEL_PADDING * 2;
export const CANVAS_HEIGHT = BOARD_SIZE + LABEL_PADDING * 2;

const LIGHT_SQUARE = '#0a0a2e';
const DARK_SQUARE = '#060618';
const SELECTED_COLOR = colors.neonCyan;
const SELECTED_GLOW = colors.neonCyanGlow;
const LEGAL_MOVE_COLOR = colors.neonGreen;
const LAST_MOVE_COLOR = 'rgba(0, 102, 255, 0.15)';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function squareFromCoords(col: number, row: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square;
}

export function coordsFromSquare(sq: Square): { col: number; row: number } {
  const file = sq.charCodeAt(0) - 97; // 'a' = 0
  const rank = 8 - parseInt(sq[1], 10);  // '8' = 0, '1' = 7
  return { col: file, row: rank };
}

export function pixelToSquare(px: number, py: number): Square | null {
  const bx = px - LABEL_PADDING;
  const by = py - LABEL_PADDING;
  if (bx < 0 || by < 0 || bx >= BOARD_SIZE || by >= BOARD_SIZE) return null;
  const col = Math.floor(bx / CELL_SIZE);
  const row = Math.floor(by / CELL_SIZE);
  return squareFromCoords(col, row);
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  selectedSquare: Square | null,
  legalMoves: Square[],
  lastMove: { from: Square; to: Square } | null,
): void {
  const ox = LABEL_PADDING;
  const oy = LABEL_PADDING;

  // Draw squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const x = ox + col * CELL_SIZE;
      const y = oy + row * CELL_SIZE;

      ctx.fillStyle = isLight ? LIGHT_SQUARE : DARK_SQUARE;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Last move highlight
      const sq = squareFromCoords(col, row);
      if (lastMove && (sq === lastMove.from || sq === lastMove.to)) {
        ctx.fillStyle = LAST_MOVE_COLOR;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Selected square highlight
  if (selectedSquare) {
    const { col, row } = coordsFromSquare(selectedSquare);
    const x = ox + col * CELL_SIZE;
    const y = oy + row * CELL_SIZE;
    drawGlowRect(ctx, x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, SELECTED_COLOR, SELECTED_GLOW, 2, 12);
  }

  // Legal move indicators
  for (const sq of legalMoves) {
    const { col, row } = coordsFromSquare(sq);
    const cx = ox + col * CELL_SIZE + CELL_SIZE / 2;
    const cy = oy + row * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.fillStyle = LEGAL_MOVE_COLOR;
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = LEGAL_MOVE_COLOR;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Neon border glow around the board
  drawGlowRect(ctx, ox - 1, oy - 1, BOARD_SIZE + 2, BOARD_SIZE + 2, colors.neonBlue, colors.neonBlueGlow, 1.5, 20, 2);

  // Labels
  const labelColor = colors.hudDim;
  const labelGlow = 'rgba(102, 119, 153, 0.3)';
  const labelSize = 10;

  for (let col = 0; col < 8; col++) {
    const x = ox + col * CELL_SIZE + CELL_SIZE / 2;
    // Bottom file labels
    drawNeonText(ctx, FILES[col], x, oy + BOARD_SIZE + LABEL_PADDING / 2 + 2, labelColor, labelGlow, labelSize, 'Orbitron');
    // Top file labels
    drawNeonText(ctx, FILES[col], x, LABEL_PADDING / 2 - 2, labelColor, labelGlow, labelSize, 'Orbitron');
  }

  for (let row = 0; row < 8; row++) {
    const y = oy + row * CELL_SIZE + CELL_SIZE / 2;
    // Left rank labels
    drawNeonText(ctx, RANKS[row], LABEL_PADDING / 2 - 2, y, labelColor, labelGlow, labelSize, 'Orbitron');
    // Right rank labels
    drawNeonText(ctx, RANKS[row], ox + BOARD_SIZE + LABEL_PADDING / 2 + 2, y, labelColor, labelGlow, labelSize, 'Orbitron');
  }
}
