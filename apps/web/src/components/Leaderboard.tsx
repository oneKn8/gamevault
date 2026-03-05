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
  1: "text-secondary border-secondary/30",
  2: "text-gray-300 border-gray-300/30",
  3: "text-orange-400 border-orange-400/30",
};

export function Leaderboard({ gameId, limit = 20 }: LeaderboardProps) {
  const [period, setPeriod] = useState<string>("alltime");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);

  const changePeriod = (newPeriod: string) => {
    setPeriod(newPeriod);
    setLoading(true);
    setFetchKey((k) => k + 1);
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/leaderboard?gameId=${gameId}&period=${period}&limit=${limit}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, limit, fetchKey]);

  return (
    <div className="rounded-lg border border-border bg-bg-raised p-4">
      {/* Period tabs */}
      <div className="mb-4 flex gap-2" role="tablist">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => changePeriod(p.key)}
            role="tab"
            aria-selected={period === p.key}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              period === p.key
                ? "bg-accent/20 text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No scores yet. Be the first to play!
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const style = rankStyles[entry.rank] ?? "text-text border-transparent";
            return (
              <div
                key={`${entry.userId}-${entry.rank}`}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${style} ${
                  entry.rank <= 3 ? "bg-white/[0.02]" : ""
                }`}
              >
                <span className="w-8 text-center font-mono text-xs">
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
                <span className="font-mono text-xs text-accent">
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
