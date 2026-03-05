"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { GameHost } from "@gamevault/game-sdk";

interface GameEmbedProps {
  gameId: string;
  src: string;
}

export function GameEmbed({ gameId, src }: GameEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<GameHost | null>(null);
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleLoad = useCallback(() => {
    if (!iframeRef.current) return;

    const host = new GameHost({
      onReady: (version) => {
        console.log(`[GameVault] ${gameId} v${version} ready`);
        const player = session?.user
          ? {
              id: session.user.id,
              username: session.user.username,
              level: session.user.level,
            }
          : { id: "guest", username: "Guest", level: 1 };
        host.sendInit(player, false);
      },
      onScoreSubmit: async (score, metadata) => {
        try {
          const res = await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, score, metadata }),
          });
          const data = await res.json();

          if (data.persisted) {
            showFeedback(`Score saved! +${data.newXp - (session?.user?.xp ?? 0)} XP`);
          } else {
            showFeedback("Sign in to save your scores!");
          }
        } catch {
          console.error("[GameVault] Failed to submit score");
        }
      },
      onAchievementUnlock: (id) => {
        console.log(`[GameVault] Achievement unlocked: ${id}`);
      },
    });

    host.attach(iframeRef.current);
    hostRef.current = host;
  }, [gameId, session]);

  useEffect(() => {
    return () => {
      hostRef.current?.detach();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={handleLoad}
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups"
        title={`${gameId} game`}
      />
      {feedback && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-neon-cyan/30 bg-neon-bg/90 px-4 py-2 text-sm text-neon-cyan shadow-neon-cyan backdrop-blur-sm">
          {feedback}
        </div>
      )}
    </div>
  );
}
