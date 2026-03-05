export function PacManCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background - dark maze */}
      <rect width="400" height="560" fill="#0f172a" />

      {/* Maze walls */}
      <g stroke="#1e3a5f" strokeWidth="3" fill="none" opacity="0.5">
        <rect x="30" y="30" width="340" height="500" rx="8" />
        <rect x="60" y="60" width="120" height="60" rx="4" />
        <rect x="220" y="60" width="120" height="60" rx="4" />
        <rect x="60" y="160" width="60" height="100" rx="4" />
        <rect x="280" y="160" width="60" height="100" rx="4" />
        <rect x="160" y="140" width="80" height="40" rx="4" />
        <rect x="60" y="300" width="120" height="40" rx="4" />
        <rect x="220" y="300" width="120" height="40" rx="4" />
        <rect x="140" y="380" width="120" height="60" rx="4" />
        <rect x="60" y="440" width="80" height="50" rx="4" />
        <rect x="260" y="440" width="80" height="50" rx="4" />
      </g>

      {/* Dots */}
      <g fill="#fbbf24" opacity="0.6">
        <circle cx="100" cy="200" r="4" />
        <circle cx="140" cy="200" r="4" />
        <circle cx="180" cy="200" r="4" />
        <circle cx="220" cy="200" r="4" />
        <circle cx="260" cy="200" r="4" />
        <circle cx="300" cy="200" r="4" />
        <circle cx="100" cy="360" r="4" />
        <circle cx="140" cy="360" r="4" />
        <circle cx="260" cy="360" r="4" />
        <circle cx="300" cy="360" r="4" />
        <circle cx="200" cy="280" r="4" />
        <circle cx="200" cy="320" r="4" />
      </g>

      {/* Power pellets */}
      <g fill="#fbbf24" opacity="0.8">
        <circle cx="60" cy="80" r="8" />
        <circle cx="340" cy="80" r="8" />
        <circle cx="60" cy="480" r="8" />
        <circle cx="340" cy="480" r="8" />
      </g>

      {/* Pac-Man */}
      <g transform="translate(180, 260)">
        <circle cx="0" cy="0" r="40" fill="#facc15" />
        <path d="M0,0 L40,-20 L40,20 Z" fill="#0f172a" />
        <circle cx="-8" cy="-18" r="5" fill="#0f172a" />
      </g>

      {/* Ghosts */}
      <g transform="translate(80, 120)">
        <path d="M-20,10 L-20,-10 Q-20,-25 0,-25 Q20,-25 20,-10 L20,10 L14,4 L8,10 L2,4 L-4,10 L-10,4 L-16,10 Z" fill="#ef4444" opacity="0.85" />
        <circle cx="-7" cy="-10" r="4" fill="white" />
        <circle cx="7" cy="-10" r="4" fill="white" />
        <circle cx="-5" cy="-10" r="2" fill="#1e293b" />
        <circle cx="9" cy="-10" r="2" fill="#1e293b" />
      </g>

      <g transform="translate(280, 140)">
        <path d="M-20,10 L-20,-10 Q-20,-25 0,-25 Q20,-25 20,-10 L20,10 L14,4 L8,10 L2,4 L-4,10 L-10,4 L-16,10 Z" fill="#ec4899" opacity="0.85" />
        <circle cx="-7" cy="-10" r="4" fill="white" />
        <circle cx="7" cy="-10" r="4" fill="white" />
        <circle cx="-5" cy="-10" r="2" fill="#1e293b" />
        <circle cx="9" cy="-10" r="2" fill="#1e293b" />
      </g>

      <g transform="translate(320, 380)">
        <path d="M-20,10 L-20,-10 Q-20,-25 0,-25 Q20,-25 20,-10 L20,10 L14,4 L8,10 L2,4 L-4,10 L-10,4 L-16,10 Z" fill="#06b6d4" opacity="0.85" />
        <circle cx="-7" cy="-10" r="4" fill="white" />
        <circle cx="7" cy="-10" r="4" fill="white" />
        <circle cx="-5" cy="-10" r="2" fill="#1e293b" />
        <circle cx="9" cy="-10" r="2" fill="#1e293b" />
      </g>

      <g transform="translate(120, 420)">
        <path d="M-20,10 L-20,-10 Q-20,-25 0,-25 Q20,-25 20,-10 L20,10 L14,4 L8,10 L2,4 L-4,10 L-10,4 L-16,10 Z" fill="#f97316" opacity="0.85" />
        <circle cx="-7" cy="-10" r="4" fill="white" />
        <circle cx="7" cy="-10" r="4" fill="white" />
        <circle cx="-5" cy="-10" r="2" fill="#1e293b" />
        <circle cx="9" cy="-10" r="2" fill="#1e293b" />
      </g>
    </svg>
  );
}
