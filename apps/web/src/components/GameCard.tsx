import type { GameManifest } from "@gamevault/shared-types";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  arcade: "text-neon-yellow border-neon-yellow/30",
  puzzle: "text-neon-purple border-neon-purple/30",
  strategy: "text-neon-cyan border-neon-cyan/30",
  io: "text-neon-green border-neon-green/30",
  party: "text-neon-pink border-neon-pink/30",
  word: "text-neon-orange border-neon-orange/30",
  card: "text-neon-red border-neon-red/30",
  sports: "text-neon-blue border-neon-blue/30",
};

export function GameCard({ game }: { game: GameManifest }) {
  const catClass = categoryColors[game.category] || "text-hud-label border-hud-label/30";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neon-blue/15 bg-neon-bg-card transition-all hover:border-neon-blue/40 hover:shadow-neon-blue"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-neon-bg-light">
        <div className="flex h-full items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-hud-dim">
            {game.name}
          </span>
        </div>
        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-neon-bg/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full border border-neon-yellow/60 bg-neon-yellow/20 px-6 py-2 font-[family-name:var(--font-display)] text-sm font-bold text-neon-yellow">
            PLAY
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-hud-text">
          {game.name}
        </h3>
        <p className="line-clamp-2 text-xs text-hud-dim">{game.description}</p>
        <div className="mt-auto flex items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${catClass}`}
          >
            {game.category}
          </span>
          {game.multiplayer && (
            <span className="text-[10px] text-hud-dim">
              {game.multiplayer.minPlayers}-{game.multiplayer.maxPlayers}P
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
