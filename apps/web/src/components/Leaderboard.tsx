"use client";

import { useEffect, useState } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
}

interface LeaderboardProps {
  gameId: string;
  limit?: number;
}

const periods = [
  { key: "alltime", label: "All Time" },
  { key: "weekly", label: "Weekly" },
  { key: "daily", label: "Daily" },
] as const;

const rankStyles: Record<number, string> = {
  1: "text-neon-yellow border-neon-yellow/30",
  2: "text-gray-300 border-gray-300/30",
  3: "text-orange-400 border-orange-400/30",
};

export function Leaderboard({ gameId, limit = 20 }: LeaderboardProps) {
  const [period, setPeriod] = useState<string>("alltime");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?gameId=${gameId}&period=${period}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [gameId, period, limit]);

  return (
    <div className="rounded-lg border border-neon-blue/20 bg-neon-bg-card p-4">
      {/* Period tabs */}
      <div className="mb-4 flex gap-2">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              period === p.key
                ? "bg-neon-blue/20 text-neon-blue shadow-neon-blue"
                : "text-hud-dim hover:text-hud-text"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-hud-dim">
          No scores yet. Be the first to play!
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const style = rankStyles[entry.rank] ?? "text-hud-text border-transparent";
            return (
              <div
                key={`${entry.userId}-${entry.rank}`}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${style} ${
                  entry.rank <= 3 ? "bg-white/[0.02]" : ""
                }`}
              >
                <span className="w-8 text-center font-[family-name:var(--font-retro)] text-xs">
                  {entry.rank <= 3 ? ["", "#1", "#2", "#3"][entry.rank] : `#${entry.rank}`}
                </span>
                {entry.avatarUrl && (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="flex-1 text-sm">{entry.username}</span>
                <span className="font-[family-name:var(--font-retro)] text-xs text-neon-cyan">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
