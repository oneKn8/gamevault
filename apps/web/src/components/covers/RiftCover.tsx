export function RiftCover({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background split: Light and Shadow */}
      <rect width="200" height="560" fill="#F5F0E8" />
      <rect x="200" width="200" height="560" fill="#0D0D1A" />

      {/* Rift line down the center */}
      <line x1="200" y1="0" x2="200" y2="560" stroke="#7C4DFF" strokeWidth="3" opacity="0.6" />
      <line x1="200" y1="0" x2="200" y2="560" stroke="#E040FB" strokeWidth="1" opacity="0.8" />

      {/* Light dimension grid */}
      <g opacity="0.06" stroke="#000">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`lv${i}`} x1={i * 20} y1="0" x2={i * 20} y2="560" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <line key={`lh${i}`} x1="0" y1={i * 20} x2="200" y2={i * 20} strokeWidth="0.5" />
        ))}
      </g>

      {/* Shadow dimension grid */}
      <g opacity="0.08" stroke="#64C8FF">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`sv${i}`} x1={200 + i * 20} y1="0" x2={200 + i * 20} y2="560" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <line key={`sh${i}`} x1="200" y1={i * 20} x2="400" y2={i * 20} strokeWidth="0.5" />
        ))}
      </g>

      {/* Light player */}
      <circle cx="120" cy="280" r="14" fill="#4FC3F7" />
      <line x1="134" y1="280" x2="144" y2="280" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />

      {/* Shadow player with glow */}
      <circle cx="280" cy="280" r="14" fill="none" stroke="#AB47BC" strokeWidth="2" />
      <circle cx="280" cy="280" r="14" fill="#AB47BC" opacity="0.2" />

      {/* Anchor (light side) */}
      <polygon points="80,180 88,186 85,195 75,195 72,186" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />

      {/* Anchor (shadow side) */}
      <polygon points="320,380 328,386 325,395 315,395 312,386" fill="none" stroke="#64C8FF" strokeWidth="2" opacity="0.5" />

      {/* Rift portal */}
      <circle cx="200" cy="160" r="20" fill="none" stroke="#E040FB" strokeWidth="2" opacity="0.5" />
      <circle cx="200" cy="160" r="12" fill="#E040FB" opacity="0.1" />

      {/* Title */}
      <text x="200" y="470" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="40">
        <tspan fill="#333">RI</tspan>
        <tspan fill="#B388FF">FT</tspan>
      </text>
      <text x="200" y="495" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#8888AA">
        Phase-Shift Arena
      </text>
    </svg>
  );
}
