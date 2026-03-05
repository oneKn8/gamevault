export function ConnectFourCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#0c1222" />

      {/* Subtle radial glow */}
      <circle cx="200" cy="280" r="240" fill="url(#c4glow)" />
      <defs>
        <radialGradient id="c4glow">
          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0c1222" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Board */}
      <g transform="translate(40, 120)">
        <rect width="320" height="320" rx="12" fill="#1d4ed8" />
        <rect width="320" height="320" rx="12" fill="url(#boardShine)" />
        <defs>
          <linearGradient id="boardShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Holes - 7 cols x 6 rows */}
        {[0, 1, 2, 3, 4, 5, 6].map((col) =>
          [0, 1, 2, 3, 4, 5].map((row) => {
            const cx = 27 + col * 44;
            const cy = 27 + row * 48;
            const key = `${col}-${row}`;

            // Some filled discs for visual interest
            const redDiscs = ["2-5", "3-5", "3-4", "4-5", "2-4", "1-5"];
            const yellowDiscs = ["3-3", "4-4", "4-3", "5-5", "5-4", "2-3"];

            let fill = "#0c1222";
            if (redDiscs.includes(key)) fill = "#ef4444";
            if (yellowDiscs.includes(key)) fill = "#facc15";

            return (
              <circle key={key} cx={cx} cy={cy} r="18" fill={fill} />
            );
          })
        )}
      </g>

      {/* Falling disc animation hint */}
      <circle cx="200" cy="80" r="18" fill="#facc15" opacity="0.9" />
      <line x1="200" y1="60" x2="200" y2="100" stroke="#facc15" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />

      {/* Bottom stand */}
      <rect x="60" y="445" width="280" height="12" rx="4" fill="#1e3a5f" />
    </svg>
  );
}
