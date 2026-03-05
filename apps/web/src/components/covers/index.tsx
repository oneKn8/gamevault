import { PacManCover } from "./PacManCover";
import { ConnectFourCover } from "./ConnectFourCover";
import { ChessCover } from "./ChessCover";
import { SnakeCover } from "./SnakeCover";
import { MinesweeperCover } from "./MinesweeperCover";
import { TetrisCover } from "./TetrisCover";
import { GridlockCover } from "./GridlockCover";
import { RiftCover } from "./RiftCover";

const coverMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "neon-pacman": PacManCover,
  "connect-four": ConnectFourCover,
  chess: ChessCover,
  snake: SnakeCover,
  minesweeper: MinesweeperCover,
  tetris: TetrisCover,
  gridlock: GridlockCover,
  rift: RiftCover,
};

function DefaultCover({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="400" height="560" fill="#111113" />
      <rect x="140" y="220" width="120" height="120" rx="16" stroke="#2a2a2e" strokeWidth="3" fill="none" />
      <path d="M185 260 L215 280 L185 300 Z" fill="#2a2a2e" />
    </svg>
  );
}

export function GameCover({
  gameId,
  className,
}: {
  gameId: string;
  className?: string;
}) {
  const Cover = coverMap[gameId] || DefaultCover;
  return <Cover className={className} />;
}
