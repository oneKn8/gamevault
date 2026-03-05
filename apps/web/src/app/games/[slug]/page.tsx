import type { Metadata } from "next";
import { getGameBySlug, getGameManifests } from "@/lib/games";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NeonButton } from "@/components/NeonButton";
import { Leaderboard } from "@/components/Leaderboard";
import { GameCover } from "@/components/covers";

export function generateStaticParams() {
  return getGameManifests().map((g) => ({ slug: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return {
    title: game.name,
    description: game.description,
  };
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
      {/* Cover banner */}
      <div className="relative mb-8 h-48 overflow-hidden rounded-xl">
        <GameCover gameId={game.id} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/games"
          className="mb-4 inline-block text-sm text-text-muted hover:text-text"
        >
          &larr; Back to games
        </Link>
        <h1 className="mb-2 text-3xl font-bold text-text">
          {game.name}
        </h1>
        <p className="mb-4 text-text-muted">{game.description}</p>

        <div className="flex items-center gap-3">
          <Link href={`/games/${game.id}/play`}>
            <NeonButton variant="highlight">Play Now</NeonButton>
          </Link>
          {game.multiplayer && (
            <span className="text-sm text-text-muted">
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
            className="rounded border border-border px-2 py-0.5 text-xs text-text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">
          Leaderboard
        </h2>
        <Leaderboard gameId={game.id} />
      </section>
    </div>
  );
}
