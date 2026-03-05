import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getTopScores } from "@gamevault/db/queries/scores";
import { getUserById } from "@gamevault/db/queries/users";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { limited } = rateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  const gameId = searchParams.get("gameId");
  const period = searchParams.get("period") ?? "alltime";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  if (!gameId) {
    return NextResponse.json(
      { error: "gameId query parameter is required" },
      { status: 400 }
    );
  }

  // Try Redis first for fast reads
  const redis = getRedis();
  if (redis) {
    let key = `lb:${gameId}:alltime`;
    if (period === "daily") {
      key = `lb:${gameId}:daily:${todayKey()}`;
    } else if (period === "weekly") {
      key = `lb:${gameId}:weekly:${weekKey()}`;
    }

    const results = await redis.zrange(key, 0, limit - 1, { rev: true, withScores: true }).catch(() => null);

    if (results && results.length > 0) {
      const entries = [];
      for (let i = 0; i < results.length; i += 2) {
        const member = results[i] as string;
        const score = results[i + 1] as number;
        const [userId, username] = member.split(":");
        entries.push({
          rank: Math.floor(i / 2) + 1,
          userId,
          username: username ?? "Unknown",
          score,
        });
      }
      return NextResponse.json({ entries, source: "cache" });
    }
  }

  // Fallback to Postgres
  const scores = await getTopScores(gameId, limit);
  const entries = await Promise.all(
    scores.map(async (s, i) => {
      const user = await getUserById(s.userId);
      return {
        rank: i + 1,
        userId: s.userId,
        username: user?.username ?? user?.name ?? "Unknown",
        avatarUrl: user?.image ?? undefined,
        score: s.score,
      };
    })
  );

  return NextResponse.json({ entries, source: "database" });
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
