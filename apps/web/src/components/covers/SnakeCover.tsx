export function SnakeCover({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background */}
      <rect width="400" height="560" fill="#0a1a0a" />

      {/* Subtle grid */}
      <g stroke="#0d2a0d" strokeWidth="0.5" opacity="0.4">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={25 * i + 25} y1="0" x2={25 * i + 25} y2="560" />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={25 * i + 25} x2="400" y2={25 * i + 25} />
        ))}
      </g>

      {/* Snake body - curving path */}
      <g>
        {/* Tail segments (darker, thinner) */}
        <rect x="50" y="425" width="22" height="22" rx="4" fill="#005522" opacity="0.5" />
        <rect x="50" y="400" width="22" height="22" rx="4" fill="#006622" opacity="0.55" />
        <rect x="50" y="375" width="22" height="22" rx="4" fill="#007733" opacity="0.6" />
        <rect x="75" y="375" width="22" height="22" rx="4" fill="#008833" opacity="0.65" />
        <rect x="100" y="375" width="22" height="22" rx="4" fill="#009944" opacity="0.7" />
        <rect x="125" y="375" width="22" height="22" rx="4" fill="#00aa44" opacity="0.75" />
        <rect x="150" y="375" width="22" height="22" rx="4" fill="#00bb55" opacity="0.8" />
        <rect x="175" y="375" width="22" height="22" rx="4" fill="#00cc55" opacity="0.82" />
        <rect x="200" y="375" width="22" height="22" rx="4" fill="#00cc66" opacity="0.85" />
        <rect x="225" y="375" width="22" height="22" rx="4" fill="#00dd66" opacity="0.87" />

        {/* Turn upward */}
        <rect x="225" y="350" width="22" height="22" rx="4" fill="#00dd77" opacity="0.88" />
        <rect x="225" y="325" width="22" height="22" rx="4" fill="#00ee77" opacity="0.9" />
        <rect x="225" y="300" width="22" height="22" rx="4" fill="#00ee88" opacity="0.9" />
        <rect x="225" y="275" width="22" height="22" rx="4" fill="#00ff88" opacity="0.92" />

        {/* Turn left */}
        <rect x="200" y="275" width="22" height="22" rx="4" fill="#00ff88" opacity="0.93" />
        <rect x="175" y="275" width="22" height="22" rx="4" fill="#00ff88" opacity="0.94" />
        <rect x="150" y="275" width="22" height="22" rx="4" fill="#00ff99" opacity="0.95" />

        {/* Turn up again */}
        <rect x="150" y="250" width="22" height="22" rx="4" fill="#00ff99" opacity="0.96" />
        <rect x="150" y="225" width="22" height="22" rx="4" fill="#00ffaa" opacity="0.97" />

        {/* Head - brighter with glow */}
        <rect x="150" y="200" width="24" height="24" rx="5" fill="#00ffaa" opacity="1" />
        {/* Eyes */}
        <circle cx="157" cy="208" r="3" fill="white" />
        <circle cx="168" cy="208" r="3" fill="white" />
        <circle cx="157" cy="207" r="1.5" fill="#0a1a0a" />
        <circle cx="168" cy="207" r="1.5" fill="#0a1a0a" />
      </g>

      {/* Head glow effect */}
      <circle cx="162" cy="212" r="30" fill="#00ff88" opacity="0.08" />
      <circle cx="162" cy="212" r="18" fill="#00ff88" opacity="0.06" />

      {/* Food - pulsing apple */}
      <g transform="translate(300, 175)">
        <circle cx="0" cy="0" r="14" fill="#ff4488" opacity="0.9" />
        <circle cx="0" cy="0" r="20" fill="#ff4488" opacity="0.12" />
        <circle cx="0" cy="0" r="26" fill="#ff4488" opacity="0.06" />
        {/* Sparkles */}
        <circle cx="18" cy="-12" r="2" fill="#ff88aa" opacity="0.7" />
        <circle cx="-14" cy="16" r="1.5" fill="#ff88aa" opacity="0.5" />
        <circle cx="12" cy="18" r="1.5" fill="#ff88aa" opacity="0.6" />
      </g>

      {/* Second food */}
      <g transform="translate(100, 125)">
        <circle cx="0" cy="0" r="12" fill="#ff4488" opacity="0.7" />
        <circle cx="0" cy="0" r="18" fill="#ff4488" opacity="0.08" />
      </g>

      {/* Score display hint */}
      <g opacity="0.3">
        <text x="30" y="35" fontFamily="monospace" fontSize="14" fill="#00ff88">SCORE: 180</text>
      </g>

      {/* Scattered trail particles */}
      <circle cx="50" cy="448" r="2" fill="#00ff88" opacity="0.2" />
      <circle cx="44" cy="440" r="1.5" fill="#00ff88" opacity="0.15" />
      <circle cx="56" cy="452" r="1" fill="#00ff88" opacity="0.1" />
    </svg>
  );
}
