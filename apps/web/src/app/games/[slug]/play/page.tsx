import { getGameBySlug, getGameManifests } from "@/lib/games";
import { notFound } from "next/navigation";
import { PlayClient } from "./PlayClient";
import { MultiplayerPlayClient } from "./MultiplayerPlayClient";

export function generateStaticParams() {
  return getGameManifests().map((g) => ({ slug: g.id }));
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string; room?: string }>;
}) {
  const { slug } = await params;
  const { mode, room } = await searchParams;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const gameSrc = `/games/${game.id}/index.html`;
  const isMultiplayer = game.multiplayer && game.multiplayer.maxPlayers > 1;

  if (isMultiplayer && mode === "multiplayer") {
    return (
      <MultiplayerPlayClient
        gameId={game.id}
        gameName={game.name}
        gameSrc={gameSrc}
      />
    );
  }

  return <PlayClient gameId={game.id} gameName={game.name} gameSrc={gameSrc} />;
}
