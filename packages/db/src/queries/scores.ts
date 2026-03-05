import { desc, eq, and } from "drizzle-orm";
import { getDb } from "../client";
import { scores } from "../schema";

export async function insertScore(data: {
  userId: string;
  gameId: string;
  score: number;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const [row] = await db
    .insert(scores)
    .values({
      userId: data.userId,
      gameId: data.gameId,
      score: data.score,
      metadata: data.metadata ?? null,
    })
    .returning();
  return row;
}

export async function getTopScores(
  gameId: string,
  limit: number = 10
) {
  const db = getDb();
  return db.query.scores.findMany({
    where: eq(scores.gameId, gameId),
    orderBy: [desc(scores.score)],
    limit,
  });
}

export async function getUserBestScore(userId: string, gameId: string) {
  const db = getDb();
  const rows = await db.query.scores.findMany({
    where: and(eq(scores.userId, userId), eq(scores.gameId, gameId)),
    orderBy: [desc(scores.score)],
    limit: 1,
  });
  return rows[0] ?? null;
}
