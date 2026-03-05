import { getGameManifests } from "@/lib/games";
import { LeaderboardPage } from "./LeaderboardPage";

export default async function LeaderboardsPage() {
  const games = await getGameManifests();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-2xl font-bold text-hud-text">
        Leaderboards
      </h1>
      <LeaderboardPage games={games.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
