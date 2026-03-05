"use client";

import { useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";

interface GameOption {
  id: string;
  name: string;
}

export function LeaderboardPage({ games }: { games: GameOption[] }) {
  const [selectedGame, setSelectedGame] = useState(games[0]?.id ?? "");

  if (games.length === 0) {
    return (
      <div className="rounded-lg border border-neon-blue/15 bg-neon-bg-card p-12 text-center">
        <p className="text-hud-dim">No games available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              selectedGame === game.id
                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                : "text-hud-dim border border-transparent hover:text-hud-text"
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>
      <Leaderboard gameId={selectedGame} />
    </div>
  );
}
