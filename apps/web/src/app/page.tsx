import { getGameManifests } from "@/lib/games";
import { GameCard } from "@/components/GameCard";
import { NeonButton } from "@/components/NeonButton";
import Link from "next/link";

export default function HomePage() {
  const games = getGameManifests();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-wider">
          <span className="text-text">GAME</span>
          <span className="text-accent">VAULT</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-text-muted">
          Multiplayer browser games. No downloads, no signups. Just play.
        </p>
        <div className="flex items-center justify-center gap-4">
          <NeonButton variant="highlight">Quick Match</NeonButton>
          <Link href="/games">
            <NeonButton variant="primary">Browse Games</NeonButton>
          </Link>
        </div>
      </section>

      {/* Game Grid */}
      <section>
        <h2 className="mb-6 text-lg font-semibold text-text">
          Games
        </h2>
        {games.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-bg-raised p-12 text-center">
            <p className="text-text-muted">No games available yet. Check back soon.</p>
          </div>
        )}
      </section>
    </div>
  );
}
