export function TetrisCover({ className }: { className?: string }) {
  const cellSize = 24;
  const cols = 10;
  const boardWidth = cols * cellSize;
  const offsetX = (400 - boardWidth) / 2;
  const offsetY = 60;

  // Tetromino colors
  const colors: Record<string, { fill: string; edge: string }> = {
    I: { fill: "#00cccc", edge: "#00ffff" },
    O: { fill: "#cccc00", edge: "#ffff00" },
    T: { fill: "#8800cc", edge: "#aa00ff" },
    S: { fill: "#00cc00", edge: "#00ff00" },
    Z: { fill: "#cc0000", edge: "#ff0000" },
    J: { fill: "#0000cc", edge: "#4444ff" },
    L: { fill: "#cc6600", edge: "#ff8800" },
  };

  // Pre-placed blocks on the board (row 0 = bottom)
  const board: { col: number; row: number; type: string }[] = [
    // Bottom row (nearly full, gap at col 6)
    { col: 0, row: 0, type: "J" }, { col: 1, row: 0, type: "J" }, { col: 2, row: 0, type: "S" },
    { col: 3, row: 0, type: "S" }, { col: 4, row: 0, type: "T" }, { col: 5, row: 0, type: "T" },
    { col: 7, row: 0, type: "L" }, { col: 8, row: 0, type: "L" }, { col: 9, row: 0, type: "L" },
    // Row 1
    { col: 0, row: 1, type: "J" }, { col: 1, row: 1, type: "Z" }, { col: 2, row: 1, type: "Z" },
    { col: 3, row: 1, type: "S" }, { col: 4, row: 1, type: "T" },
    { col: 7, row: 1, type: "O" }, { col: 8, row: 1, type: "O" }, { col: 9, row: 1, type: "L" },
    // Row 2
    { col: 0, row: 2, type: "Z" }, { col: 1, row: 2, type: "Z" },
    { col: 7, row: 2, type: "O" }, { col: 8, row: 2, type: "O" },
    // Row 3
    { col: 0, row: 3, type: "I" }, { col: 1, row: 3, type: "I" }, { col: 2, row: 3, type: "I" }, { col: 3, row: 3, type: "I" },
    // Scattered higher pieces
    { col: 5, row: 4, type: "S" }, { col: 6, row: 4, type: "S" },
    { col: 4, row: 4, type: "S" }, { col: 5, row: 5, type: "S" },
  ];

  // Active falling T-piece
  const activePiece = [
    { col: 4, row: 12, type: "T" },
    { col: 3, row: 12, type: "T" },
    { col: 5, row: 12, type: "T" },
    { col: 4, row: 13, type: "T" },
  ];

  // Ghost piece
  const ghostPiece = [
    { col: 4, row: 6, type: "T" },
    { col: 3, row: 6, type: "T" },
    { col: 5, row: 6, type: "T" },
    { col: 4, row: 7, type: "T" },
  ];

  function renderBlock(col: number, row: number, type: string, opacity = 1) {
    const c = colors[type];
    const x = offsetX + col * cellSize;
    // Flip Y: row 0 is at the bottom of the visible area
    const y = offsetY + (19 - row) * cellSize;
    return (
      <g key={`${col},${row},${type}`} opacity={opacity}>
        <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx="2" fill={c.fill} />
        <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx="2" fill="none" stroke={c.edge} strokeWidth="1" opacity="0.6" />
      </g>
    );
  }

  function renderGhostBlock(col: number, row: number, type: string) {
    const c = colors[type];
    const x = offsetX + col * cellSize;
    const y = offsetY + (19 - row) * cellSize;
    return (
      <g key={`ghost-${col},${row}`} opacity="0.25">
        <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx="2" fill="none" stroke={c.edge} strokeWidth="1.5" strokeDasharray="3 2" />
      </g>
    );
  }

  // Next piece preview (I-piece)
  const nextPieceX = offsetX + boardWidth + 16;
  const nextPieceY = offsetY + 30;

  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#0a0a0f" />

      {/* Board border */}
      <rect
        x={offsetX - 2}
        y={offsetY - 2}
        width={boardWidth + 4}
        height={20 * cellSize + 4}
        rx="2"
        fill="none"
        stroke="#222233"
        strokeWidth="2"
      />

      {/* Board background */}
      <rect x={offsetX} y={offsetY} width={boardWidth} height={20 * cellSize} fill="#0f0f1a" />

      {/* Subtle grid lines */}
      <g stroke="#161625" strokeWidth="0.5" opacity="0.5">
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line key={`v${i}`} x1={offsetX + i * cellSize} y1={offsetY} x2={offsetX + i * cellSize} y2={offsetY + 20 * cellSize} />
        ))}
        {Array.from({ length: 21 }, (_, i) => (
          <line key={`h${i}`} x1={offsetX} y1={offsetY + i * cellSize} x2={offsetX + boardWidth} y2={offsetY + i * cellSize} />
        ))}
      </g>

      {/* Locked board blocks */}
      {board.map((b) => renderBlock(b.col, b.row, b.type, 0.9))}

      {/* Ghost piece */}
      {ghostPiece.map((b) => renderGhostBlock(b.col, b.row, b.type))}

      {/* Active falling piece */}
      {activePiece.map((b) => renderBlock(b.col, b.row, b.type, 1))}

      {/* NEXT label */}
      <text x={nextPieceX} y={offsetY + 10} fontFamily="'Orbitron', monospace" fontSize="10" fill="#555566" fontWeight="600">NEXT</text>

      {/* Next piece: I-piece horizontal */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`next-${i}`} opacity="0.7">
          <rect
            x={nextPieceX + i * 14}
            y={nextPieceY}
            width={12}
            height={12}
            rx="1"
            fill={colors.I.fill}
          />
          <rect
            x={nextPieceX + i * 14}
            y={nextPieceY}
            width={12}
            height={12}
            rx="1"
            fill="none"
            stroke={colors.I.edge}
            strokeWidth="0.5"
            opacity="0.6"
          />
        </g>
      ))}

      {/* HOLD label */}
      <text x={8} y={offsetY + 10} fontFamily="'Orbitron', monospace" fontSize="10" fill="#555566" fontWeight="600">HOLD</text>

      {/* Held piece: S-piece */}
      {[
        [0, 1], [1, 1], [1, 0], [2, 0],
      ].map(([cx, cy], i) => (
        <g key={`hold-${i}`} opacity="0.5">
          <rect
            x={8 + cx * 14}
            y={offsetY + 20 + cy * 14}
            width={12}
            height={12}
            rx="1"
            fill={colors.S.fill}
          />
        </g>
      ))}

      {/* Score area */}
      <g opacity="0.35">
        <text x={offsetX} y={offsetY + 20 * cellSize + 28} fontFamily="'Orbitron', monospace" fontSize="11" fill="#8888aa" fontWeight="600">SCORE</text>
        <text x={offsetX} y={offsetY + 20 * cellSize + 46} fontFamily="monospace" fontSize="16" fill="#ffffff" fontWeight="700">12,400</text>
        <text x={offsetX + boardWidth - 60} y={offsetY + 20 * cellSize + 28} fontFamily="'Orbitron', monospace" fontSize="11" fill="#8888aa" fontWeight="600">LVL 5</text>
      </g>
    </svg>
  );
}
