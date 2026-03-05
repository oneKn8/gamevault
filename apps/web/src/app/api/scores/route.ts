import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertScore } from "@gamevault/db/queries/scores";
import { updateUserXp, getUserById } from "@gamevault/db/queries/users";
import { activity } from "@gamevault/db/schema";
import { getDb } from "@gamevault/db/client";
import { getRedis } from "@/lib/redis";

function calculateLevel(xp: number): number {
  // 100 XP per level, increasing by 50 each level
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold += 50;
  }
  return level;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.gameId !== "string" || typeof body.score !== "number") {
    return NextResponse.json(
      { error: "Invalid body: gameId (string) and score (number) required" },
      { status: 400 }
    );
  }

  const { gameId, score, metadata } = body;

  if (score < 0 || !Number.isFinite(score)) {
    return NextResponse.json(
      { error: "Score must be a non-negative finite number" },
      { status: 400 }
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ persisted: false });
  }

  const userId = session.user.id;

  // Insert score into Postgres
  const row = await insertScore({
    userId,
    gameId,
    score,
    metadata: metadata ?? undefined,
  });

  // Update Redis sorted sets (best-effort)
  const redis = getRedis();
  if (redis) {
    const member = `${userId}:${session.user.username}`;
    await Promise.all([
      redis.zadd(`lb:${gameId}:alltime`, { gt: true }, { score, member }),
      redis.zadd(`lb:${gameId}:daily:${todayKey()}`, { gt: true }, { score, member }),
      redis.zadd(`lb:${gameId}:weekly:${weekKey()}`, { gt: true }, { score, member }),
    ]).catch(() => {});
  }

  // Update user XP
  const xpGain = Math.min(Math.floor(score / 10), 100); // Cap XP gain at 100
  const user = await getUserById(userId);
  if (user) {
    const newXp = user.xp + xpGain;
    const newLevel = calculateLevel(newXp);
    await updateUserXp(userId, newXp, newLevel);

    // Insert activity
    const db = getDb();
    await db.insert(activity).values({
      userId,
      type: "score",
      gameId,
      data: { score, xpGain },
    });

    return NextResponse.json({
      persisted: true,
      scoreId: row.id,
      newXp,
      newLevel,
    });
  }

  return NextResponse.json({ persisted: true, scoreId: row.id });
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}
