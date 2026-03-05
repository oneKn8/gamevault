export function ChessCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#0f1419" />

      {/* Angled chessboard */}
      <g transform="translate(200, 310) rotate(-15) scale(0.85)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((row) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={-160 + col * 40}
              y={-160 + row * 40}
              width="40"
              height="40"
              fill={(row + col) % 2 === 0 ? "#d4c5a9" : "#5c4a32"}
              opacity="0.7"
            />
          ))
        )}
      </g>

      {/* Vignette overlay */}
      <rect width="400" height="560" fill="url(#chessVignette)" />
      <defs>
        <radialGradient id="chessVignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0f1419" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1419" stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* King piece - simplified silhouette */}
      <g transform="translate(140, 120)" fill="#e2d9c8" opacity="0.9">
        <rect x="12" y="0" width="6" height="16" rx="1" />
        <rect x="6" y="5" width="18" height="6" rx="1" />
        <path d="M0,28 Q0,20 6,18 L24,18 Q30,20 30,28 L28,36 L2,36 Z" />
        <rect x="-2" y="36" width="34" height="8" rx="2" />
        <path d="M-4,44 L34,44 L30,56 L0,56 Z" />
        <rect x="-6" y="56" width="42" height="8" rx="2" />
      </g>

      {/* Queen piece */}
      <g transform="translate(230, 160)" fill="#a08c6e" opacity="0.8">
        <circle cx="15" cy="4" r="5" />
        <path d="M0,14 L6,30 L10,16 L15,32 L20,16 L24,30 L30,14 L28,36 L2,36 Z" />
        <rect x="0" y="36" width="30" height="7" rx="2" />
        <path d="M-2,43 L32,43 L28,54 L4,54 Z" />
        <rect x="-4" y="54" width="38" height="7" rx="2" />
      </g>

      {/* Knight piece */}
      <g transform="translate(100, 280)" fill="#c4b598" opacity="0.6">
        <path d="M8,0 Q4,4 6,12 L2,18 Q0,22 4,24 L8,22 Q12,28 10,36 L26,36 L26,20 Q28,14 24,10 Q20,6 16,4 Z" />
        <rect x="4" y="36" width="26" height="7" rx="2" />
        <rect x="2" y="43" width="30" height="6" rx="2" />
      </g>

      {/* Pawn piece */}
      <g transform="translate(280, 320)" fill="#8a7a62" opacity="0.5">
        <circle cx="12" cy="6" r="7" />
        <path d="M4,14 Q2,20 6,24 L18,24 Q22,20 20,14 Z" />
        <rect x="2" y="24" width="20" height="6" rx="2" />
        <rect x="0" y="30" width="24" height="5" rx="2" />
      </g>

      {/* Bottom gradient fade */}
      <rect y="440" width="400" height="120" fill="url(#chessBotFade)" />
      <defs>
        <linearGradient id="chessBotFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f1419" stopOpacity="0" />
          <stop offset="100%" stopColor="#0f1419" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
