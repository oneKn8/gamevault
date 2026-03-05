import { getGameManifests } from "@/lib/games";
import { LeaderboardPage } from "./LeaderboardPage";

export default async function LeaderboardsPage() {
  const games = await getGameManifests();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-text">
        Leaderboards
      </h1>
      <LeaderboardPage games={games.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
