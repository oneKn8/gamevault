import { getGameManifests } from "@/lib/games";
import { GameCard } from "@/components/GameCard";

export default function GamesPage() {
  const games = getGameManifests();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-text">
        All Games
      </h1>
      {games.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-bg-raised p-12 text-center">
          <p className="text-text-muted">No games available yet.</p>
        </div>
      )}
    </div>
  );
}
