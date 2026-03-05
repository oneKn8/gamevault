export function GridlockCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#1e1e2e" />

      {/* Isometric grid */}
      <g transform="translate(200, 290) scale(0.9)">
        {/* Board platform shadow */}
        <path d="M-140,10 L0,90 L140,10 L0,-70 Z" fill="#2a2a3a" />

        {/* Grid tiles - 8x8 isometric */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
            const isoX = (col - row) * 16;
            const isoY = (col + row) * 8;

            // Territory coloring
            let fill = "#4a4a58";
            let opacity = 0.7;

            // Blue territory (player - bottom-left cluster)
            if ((row >= 5 && col <= 3) || (row === 4 && col <= 1)) {
              fill = "#3b82f6";
              opacity = 0.65;
            }
            // Red territory (AI 1 - top-right cluster)
            if ((row <= 2 && col >= 5) || (row === 3 && col >= 7)) {
              fill = "#ef4444";
              opacity = 0.65;
            }
            // Green territory (AI 2 - top-left area)
            if ((row <= 1 && col <= 2) || (row === 2 && col === 0)) {
              fill = "#22c55e";
              opacity = 0.6;
            }

            // Obstacles
            if ((row === 3 && col === 3) || (row === 4 && col === 4) ||
                (row === 2 && col === 5) || (row === 5 && col === 2)) {
              fill = "#2a2a35";
              opacity = 0.8;
            }

            return (
              <path
                key={`${row}-${col}`}
                d={`M${isoX},${isoY - 8} L${isoX + 15},${isoY - 1} L${isoX},${isoY + 6} L${isoX - 15},${isoY - 1} Z`}
                fill={fill}
                opacity={opacity}
                stroke="#35354a"
                strokeWidth="0.5"
              />
            );
          })
        )}

        {/* Piece silhouettes */}
        {/* Blue piece */}
        <g transform="translate(-48, 56)">
          <ellipse cx="0" cy="0" rx="6" ry="3" fill="#2563eb" opacity="0.9" />
          <rect x="-4" y="-12" width="8" height="12" rx="2" fill="#3b82f6" opacity="0.9" />
          <circle cx="0" cy="-14" r="4" fill="#60a5fa" opacity="0.9" />
        </g>

        {/* Red piece */}
        <g transform="translate(64, -24)">
          <ellipse cx="0" cy="0" rx="6" ry="3" fill="#dc2626" opacity="0.9" />
          <rect x="-4" y="-12" width="8" height="12" rx="2" fill="#ef4444" opacity="0.9" />
          <circle cx="0" cy="-14" r="4" fill="#f87171" opacity="0.9" />
        </g>

        {/* Green piece */}
        <g transform="translate(-80, -40)">
          <ellipse cx="0" cy="0" rx="6" ry="3" fill="#16a34a" opacity="0.8" />
          <rect x="-4" y="-12" width="8" height="12" rx="2" fill="#22c55e" opacity="0.8" />
          <circle cx="0" cy="-14" r="4" fill="#4ade80" opacity="0.8" />
        </g>

        {/* Movement arrows */}
        <g opacity="0.5">
          {/* Blue arrow (moving right) */}
          <line x1="-42" y1="52" x2="-28" y2="44" stroke="#3b82f6" strokeWidth="2" />
          <polygon points="-28,41 -24,44 -28,47" fill="#3b82f6" />

          {/* Red arrow (moving left) */}
          <line x1="58" y1="-28" x2="44" y2="-20" stroke="#ef4444" strokeWidth="2" />
          <polygon points="44,-23 40,-20 44,-17" fill="#ef4444" />
        </g>
      </g>

      {/* Vignette */}
      <rect width="400" height="560" fill="url(#gridlockVignette)" />
      <defs>
        <radialGradient id="gridlockVignette" cx="50%" cy="52%" r="55%">
          <stop offset="0%" stopColor="#1e1e2e" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e1e2e" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Bottom fade */}
      <rect y="440" width="400" height="120" fill="url(#gridlockBotFade)" />
      <defs>
        <linearGradient id="gridlockBotFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1e2e" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e1e2e" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
