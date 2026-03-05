import { getGameBySlug, getGameManifests } from "@/lib/games";
import { notFound } from "next/navigation";
import { PlayClient } from "./PlayClient";

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

  const gameSrc = `/games/${game.id}/index.html`;

  return <PlayClient gameId={game.id} gameName={game.name} gameSrc={gameSrc} />;
}
