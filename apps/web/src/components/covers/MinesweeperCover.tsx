export function MinesweeperCover({ className }: { className?: string }) {
  const tileSize = 38;
  const cols = 9;
  const rows = 11;
  const offsetX = (400 - cols * tileSize) / 2;
  const offsetY = 80;

  // Pre-defined board state for the cover art
  const revealed: Record<string, number | "mine" | "flag" | null> = {
    // Revealed numbers
    "0,0": null, "1,0": null, "2,0": null, "3,0": 1, "4,0": null, "5,0": null, "6,0": null, "7,0": 1, "8,0": null,
    "0,1": null, "1,1": null, "2,1": 1, "3,1": 1, "4,1": 1, "5,1": null, "6,1": 1, "7,1": 2, "8,1": 1,
    "0,2": null, "1,2": 1, "2,2": 2, "5,2": 1, "6,2": 1,
    "0,3": null, "1,3": 1, "3,3": 3, "4,3": 2, "5,3": 1,
    "0,4": 1, "1,4": 2, "7,4": 1, "8,4": 1,
    "0,5": 1, "5,5": 1, "6,5": 1,
    // Flags
    "3,2": "flag", "7,6": "flag", "2,5": "flag",
  };

  const numberColors: Record<number, string> = {
    1: "#4488ff",
    2: "#44cc44",
    3: "#ff4444",
  };

  function renderTile(col: number, row: number) {
    const x = offsetX + col * tileSize;
    const y = offsetY + row * tileSize;
    const key = `${col},${row}`;
    const val = revealed[key];

    if (val === undefined) {
      // Hidden tile with 3D bevel
      return (
        <g key={key}>
          <rect x={x} y={y} width={tileSize - 2} height={tileSize - 2} rx="2" fill="#2a2a3a" />
          <line x1={x} y1={y} x2={x + tileSize - 2} y2={y} stroke="#3a3a4a" strokeWidth="2" />
          <line x1={x} y1={y} x2={x} y2={y + tileSize - 2} stroke="#3a3a4a" strokeWidth="2" />
          <line x1={x + tileSize - 2} y1={y} x2={x + tileSize - 2} y2={y + tileSize - 2} stroke="#1a1a2a" strokeWidth="2" />
          <line x1={x} y1={y + tileSize - 2} x2={x + tileSize - 2} y2={y + tileSize - 2} stroke="#1a1a2a" strokeWidth="2" />
        </g>
      );
    }

    if (val === "flag") {
      return (
        <g key={key}>
          <rect x={x} y={y} width={tileSize - 2} height={tileSize - 2} rx="2" fill="#2a2a3a" />
          <line x1={x} y1={y} x2={x + tileSize - 2} y2={y} stroke="#3a3a4a" strokeWidth="2" />
          <line x1={x} y1={y} x2={x} y2={y + tileSize - 2} stroke="#3a3a4a" strokeWidth="2" />
          {/* Flag pole */}
          <line x1={x + 19} y1={y + 8} x2={x + 19} y2={y + 28} stroke="#888" strokeWidth="2" />
          {/* Flag triangle */}
          <path d={`M${x + 19},${y + 8} L${x + 30},${y + 13} L${x + 19},${y + 18} Z`} fill="#ef4444" />
          {/* Base */}
          <line x1={x + 14} y1={y + 28} x2={x + 24} y2={y + 28} stroke="#888" strokeWidth="2" />
        </g>
      );
    }

    // Revealed tile
    return (
      <g key={key}>
        <rect x={x} y={y} width={tileSize - 2} height={tileSize - 2} rx="2" fill="#161622" />
        {val !== null && typeof val === "number" && (
          <text
            x={x + (tileSize - 2) / 2}
            y={y + (tileSize - 2) / 2 + 6}
            textAnchor="middle"
            fontFamily="'Orbitron', monospace"
            fontWeight="700"
            fontSize="18"
            fill={numberColors[val] || "#ffffff"}
          >
            {val}
          </text>
        )}
      </g>
    );
  }

  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push(renderTile(col, row));
    }
  }

  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#0a0a14" />

      {/* Header bar */}
      <g>
        <rect x={offsetX} y="30" width={cols * tileSize} height="36" rx="4" fill="#161622" />
        {/* Mine counter */}
        <text x={offsetX + 12} y="54" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#ef4444">007</text>
        {/* Smiley */}
        <g transform={`translate(${offsetX + cols * tileSize / 2}, 48)`}>
          <circle cx="0" cy="0" r="12" fill="#facc15" />
          <circle cx="-4" cy="-3" r="2" fill="#0a0a14" />
          <circle cx="4" cy="-3" r="2" fill="#0a0a14" />
          <path d="M-5,4 Q0,9 5,4" stroke="#0a0a14" strokeWidth="1.5" fill="none" />
        </g>
        {/* Timer */}
        <text x={offsetX + cols * tileSize - 48} y="54" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#44cc44">042</text>
      </g>

      {/* Grid tiles */}
      {tiles}
    </svg>
  );
}
