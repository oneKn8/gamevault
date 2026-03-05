"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameManifest } from "@gamevault/shared-types";
import { GameCover } from "@/components/covers";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  arcade: "bg-cat-arcade/20 text-cat-arcade",
  puzzle: "bg-cat-puzzle/20 text-cat-puzzle",
  strategy: "bg-cat-strategy/20 text-cat-strategy",
  io: "bg-cat-io/20 text-cat-io",
  party: "bg-cat-party/20 text-cat-party",
};

const descriptions: Record<string, string> = {
  "neon-pacman": "Navigate the maze, eat dots, dodge ghosts. The classic arcade experience reimagined.",
  "connect-four": "Drop discs, think ahead, connect four to win. Challenge a smart AI opponent.",
  chess: "The ultimate strategy game. Checkmate your opponent in this timeless classic.",
};

export function HeroCarousel({ games }: { games: GameManifest[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % games.length);
  }, [games.length]);

  useEffect(() => {
    if (paused || games.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next, games.length]);

  if (games.length === 0) return null;

  const game = games[active];
  const catClass = categoryColors[game.category] || "bg-accent/20 text-accent";

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-bg-raised"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex min-h-[280px] sm:min-h-[360px] md:min-h-[420px]">
        {/* Main content area */}
        <div className="relative flex flex-1 items-end p-4 sm:p-6 md:p-8">
          {/* Background cover art */}
          {games.map((g, i) => (
            <div
              key={g.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <GameCover gameId={g.id} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-raised/95 via-bg-raised/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-raised via-transparent to-transparent" />
            </div>
          ))}

          {/* Text overlay */}
          <div className="relative z-10 max-w-md">
            <span className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${catClass}`}>
              {game.category}
            </span>
            <h2 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-text">{game.name}</h2>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">
              {descriptions[game.id] || game.description}
            </p>
            <Link
              href={`/games/${game.id}/play`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Play Now
            </Link>
          </div>
        </div>

        {/* Right sidebar thumbnails */}
        <div className="hidden w-48 flex-col gap-2 p-4 md:flex">
          {games.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setActive(i)}
              aria-label={`Show ${g.name}`}
              className={`overflow-hidden rounded-lg border-2 transition-all ${
                i === active
                  ? "border-accent shadow-md shadow-accent/20"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <GameCover gameId={g.id} className="aspect-[3/2] w-full" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom dot indicators */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActive(i)}
            aria-label={`Go to ${g.name}`}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-8 bg-accent" : "w-4 bg-text-muted/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
