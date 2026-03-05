import { notFound } from "next/navigation";
import { getUserByUsername } from "@gamevault/db/queries/users";
import { getDb } from "@gamevault/db/client";
import { scores, activity } from "@gamevault/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";

function getActivityScore(data: unknown): number | null {
  if (data && typeof data === "object" && "score" in data) {
    const score = (data as Record<string, unknown>).score;
    return typeof score === "number" ? score : null;
  }
  return null;
}

function xpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += 100 + (i - 1) * 50;
  }
  return total;
}

function xpToNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let user;
  try {
    user = await getUserByUsername(decodeURIComponent(username));
  } catch {
    // DB not configured - show placeholder
    user = null;
  }

  if (!user) {
    notFound();
  }

  const db = getDb();

  // Get stats
  const [scoreStats] = await db
    .select({
      totalScores: count(),
      gamesPlayed: sql<number>`count(distinct ${scores.gameId})`,
    })
    .from(scores)
    .where(eq(scores.userId, user.id));

  // Get best scores per game
  const bestScores = await db
    .select({
      gameId: scores.gameId,
      bestScore: sql<number>`max(${scores.score})`,
    })
    .from(scores)
    .where(eq(scores.userId, user.id))
    .groupBy(scores.gameId);

  // Get recent activity
  const recentActivity = await db.query.activity.findMany({
    where: eq(activity.userId, user.id),
    orderBy: [desc(activity.createdAt)],
    limit: 10,
  });

  const currentLevelXp = user.xp - xpForLevel(user.level);
  const neededXp = xpToNextLevel(user.level);
  const xpPercent = Math.min((currentLevelXp / neededXp) * 100, 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile header */}
      <div className="mb-8 flex items-center gap-4">
        {user.image && (
          <img
            src={user.image}
            alt=""
            className="h-16 w-16 rounded-full border-2 border-border-highlight"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-text">
            {user.username ?? user.name}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded bg-accent/20 px-2 py-0.5 text-accent">
              Level {user.level}
            </span>
            <span className="text-text-muted">{user.xp.toLocaleString()} XP</span>
            {user.streakDays > 0 && (
              <span className="text-secondary">{user.streakDays} day streak</span>
            )}
          </div>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="mb-8">
        <div className="mb-1 flex justify-between text-xs text-text-muted">
          <span>Level {user.level}</span>
          <span>Level {user.level + 1}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg-overlay">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-text-muted">
          {currentLevelXp}/{neededXp} XP
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-bg-raised p-4 text-center">
          <p className="font-mono text-lg text-accent">
            {scoreStats?.totalScores ?? 0}
          </p>
          <p className="text-xs text-text-muted">Total Scores</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-raised p-4 text-center">
          <p className="font-mono text-lg text-accent">
            {scoreStats?.gamesPlayed ?? 0}
          </p>
          <p className="text-xs text-text-muted">Games Played</p>
        </div>
        <div className="rounded-lg border border-border bg-bg-raised p-4 text-center">
          <p className="font-mono text-lg text-accent">
            {user.streakDays}
          </p>
          <p className="text-xs text-text-muted">Day Streak</p>
        </div>
      </div>

      {/* Best scores per game */}
      {bestScores.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-text">
            Best Scores
          </h2>
          <div className="space-y-2">
            {bestScores.map((s) => (
              <div
                key={s.gameId}
                className="flex items-center justify-between rounded-md border border-border bg-bg-raised px-4 py-2"
              >
                <span className="text-sm text-text">{s.gameId}</span>
                <span className="font-mono text-xs text-accent">
                  {s.bestScore?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-text">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-md border border-border bg-bg-raised px-4 py-2"
              >
                <span className="text-xs text-text-muted">
                  {a.type === "score" && "Scored"}
                  {a.type === "achievement" && "Unlocked"}
                  {a.type === "level_up" && "Leveled up"}
                  {a.type === "streak" && "Streak"}
                </span>
                {a.gameId && (
                  <span className="text-xs text-text-secondary">{a.gameId}</span>
                )}
                {getActivityScore(a.data) !== null && (
                  <span className="font-mono text-xs text-accent">
                    {getActivityScore(a.data)!.toLocaleString()}
                  </span>
                )}
                <span className="ml-auto text-xs text-text-muted">
                  {a.createdAt.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
