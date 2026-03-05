import type { Square } from 'chess.js';

export const CELL_SIZE = 64;
export const BOARD_SIZE = CELL_SIZE * 8; // 512
export const LABEL_PADDING = 28;
export const CANVAS_WIDTH = BOARD_SIZE + LABEL_PADDING * 2;
export const CANVAS_HEIGHT = BOARD_SIZE + LABEL_PADDING * 2;

const LIGHT_SQUARE = '#f0d9b5';
const DARK_SQUARE = '#b58863';
const SELECTED_COLOR = 'rgba(255, 255, 0, 0.4)';
const LEGAL_MOVE_COLOR = 'rgba(0, 0, 0, 0.25)';
const LAST_MOVE_COLOR = 'rgba(255, 255, 0, 0.2)';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function squareFromCoords(col: number, row: number): Square {
  return `${FILES[col]}${RANKS[row]}` as Square;
}

export function coordsFromSquare(sq: Square): { col: number; row: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
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
    ctx.fillStyle = SELECTED_COLOR;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  // Legal move indicators
  for (const sq of legalMoves) {
    const { col, row } = coordsFromSquare(sq);
    const cx = ox + col * CELL_SIZE + CELL_SIZE / 2;
    const cy = oy + row * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.fillStyle = LEGAL_MOVE_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Board border
  ctx.strokeStyle = '#5a3e28';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox - 1, oy - 1, BOARD_SIZE + 2, BOARD_SIZE + 2);

  // Subtle vignette on board edges
  ctx.save();
  const vigSize = 12;
  // Top edge
  const topGrad = ctx.createLinearGradient(ox, oy, ox, oy + vigSize);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(ox, oy, BOARD_SIZE, vigSize);
  // Bottom edge
  const botGrad = ctx.createLinearGradient(ox, oy + BOARD_SIZE - vigSize, ox, oy + BOARD_SIZE);
  botGrad.addColorStop(0, 'transparent');
  botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(ox, oy + BOARD_SIZE - vigSize, BOARD_SIZE, vigSize);
  // Left edge
  const leftGrad = ctx.createLinearGradient(ox, oy, ox + vigSize, oy);
  leftGrad.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
  leftGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(ox, oy, vigSize, BOARD_SIZE);
  // Right edge
  const rightGrad = ctx.createLinearGradient(ox + BOARD_SIZE - vigSize, oy, ox + BOARD_SIZE, oy);
  rightGrad.addColorStop(0, 'transparent');
  rightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(ox + BOARD_SIZE - vigSize, oy, vigSize, BOARD_SIZE);
  ctx.restore();

  // Labels
  const labelColor = '#8b7355';
  ctx.font = '10px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = labelColor;

  for (let col = 0; col < 8; col++) {
    const x = ox + col * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillText(FILES[col], x, oy + BOARD_SIZE + LABEL_PADDING / 2 + 2);
    ctx.fillText(FILES[col], x, LABEL_PADDING / 2 - 2);
  }

  for (let row = 0; row < 8; row++) {
    const y = oy + row * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillText(RANKS[row], LABEL_PADDING / 2 - 2, y);
    ctx.fillText(RANKS[row], ox + BOARD_SIZE + LABEL_PADDING / 2 + 2, y);
  }
}
