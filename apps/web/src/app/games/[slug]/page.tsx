import { getGameBySlug, getGameManifests } from "@/lib/games";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NeonButton } from "@/components/NeonButton";
import { Leaderboard } from "@/components/Leaderboard";

export function generateStaticParams() {
  return getGameManifests().map((g) => ({ slug: g.id }));
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/games"
          className="mb-4 inline-block text-sm text-hud-dim hover:text-hud-text"
        >
          &larr; Back to games
        </Link>
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl font-bold text-hud-text">
          {game.name}
        </h1>
        <p className="mb-4 text-hud-dim">{game.description}</p>

        <div className="flex items-center gap-3">
          <Link href={`/games/${game.id}/play`}>
            <NeonButton variant="yellow">Play Now</NeonButton>
          </Link>
          {game.multiplayer && (
            <span className="text-sm text-hud-dim">
              {game.multiplayer.minPlayers}-{game.multiplayer.maxPlayers} players
              ({game.multiplayer.modes.join(", ")})
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8 flex flex-wrap gap-2">
        {game.tags.map((tag) => (
          <span
            key={tag}
            className="rounded border border-hud-dim/20 px-2 py-0.5 text-xs text-hud-dim"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-hud-text">
          Leaderboard
        </h2>
        <Leaderboard gameId={game.id} />
      </section>
    </div>
  );
}
