import type { GameManifest } from "@gamevault/shared-types";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  arcade: "text-cat-arcade border-cat-arcade/30",
  puzzle: "text-cat-puzzle border-cat-puzzle/30",
  strategy: "text-cat-strategy border-cat-strategy/30",
  io: "text-cat-io border-cat-io/30",
  party: "text-cat-party border-cat-party/30",
  word: "text-cat-word border-cat-word/30",
  card: "text-cat-card border-cat-card/30",
  sports: "text-cat-sports border-cat-sports/30",
};

export function GameCard({ game }: { game: GameManifest }) {
  const catClass = categoryColors[game.category] || "text-text-secondary border-text-secondary/30";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-bg-raised transition-all hover:border-border-highlight"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-bg-overlay">
        <div className="flex h-full items-center justify-center">
          <span className="text-lg font-bold text-text-muted">
            {game.name}
          </span>
        </div>
        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-bg/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full border border-secondary/60 bg-secondary/20 px-6 py-2 text-sm font-bold text-secondary">
            PLAY
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold text-text">
          {game.name}
        </h3>
        <p className="line-clamp-2 text-xs text-text-muted">{game.description}</p>
        <div className="mt-auto flex items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${catClass}`}
          >
            {game.category}
          </span>
          {game.multiplayer && (
            <span className="text-[10px] text-text-muted">
              {game.multiplayer.minPlayers}-{game.multiplayer.maxPlayers}P
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
