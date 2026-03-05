import type { GameManifest } from "@gamevault/shared-types";
import Link from "next/link";
import { GameCover } from "@/components/covers";

const categoryColors: Record<string, string> = {
  arcade: "bg-cat-arcade/20 text-cat-arcade",
  puzzle: "bg-cat-puzzle/20 text-cat-puzzle",
  strategy: "bg-cat-strategy/20 text-cat-strategy",
  io: "bg-cat-io/20 text-cat-io",
  party: "bg-cat-party/20 text-cat-party",
  word: "bg-cat-word/20 text-cat-word",
  card: "bg-cat-card/20 text-cat-card",
  sports: "bg-cat-sports/20 text-cat-sports",
};

export function GameCard({ game }: { game: GameManifest }) {
  const catClass = categoryColors[game.category] || "bg-text-secondary/20 text-text-secondary";

  return (
    <Link
      href={`/games/${game.id}`}
      aria-label={game.name}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-bg-raised transition-all duration-300 ease-out hover:-translate-y-1 hover:border-border-highlight hover:shadow-lg hover:shadow-accent/5"
    >
      {/* Cover art */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <GameCover gameId={game.id} className="h-full w-full" />
        {/* Category pill overlay */}
        <div className="absolute left-2 top-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur-sm ${catClass}`}>
            {game.category}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-sm font-semibold text-text">
          {game.name}
        </h3>
        <p className="line-clamp-2 text-xs text-text-muted">{game.description}</p>
        {game.multiplayer && (
          <span className="mt-auto text-[10px] text-text-muted">
            {game.multiplayer.minPlayers}-{game.multiplayer.maxPlayers} players
          </span>
        )}
      </div>
    </Link>
  );
}
