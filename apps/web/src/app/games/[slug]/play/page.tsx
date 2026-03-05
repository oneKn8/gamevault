import { getGameBySlug, getGameManifests } from "@/lib/games";
import { notFound } from "next/navigation";
import { GameEmbed } from "@/components/GameEmbed";

export function generateStaticParams() {
  return getGameManifests().map((g) => ({ slug: g.id }));
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  // In dev, games are served from their own dev servers or dist/ folders.
  // In prod, games are deployed as static assets.
  const gameSrc = `/games/${game.id}/index.html`;

  return (
    <div className="fixed inset-0 top-16 bg-bg">
      {/* HUD bar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-bg-raised px-4">
        <a
          href={`/games/${game.id}`}
          className="text-xs text-text-muted hover:text-text"
        >
          &larr; {game.name}
        </a>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-secondary">
            {game.name.toUpperCase()}
          </span>
        </div>
      </div>
      {/* Game iframe */}
      <div className="h-[calc(100%-2.5rem)]">
        <GameEmbed gameId={game.id} src={gameSrc} />
      </div>
    </div>
  );
}
