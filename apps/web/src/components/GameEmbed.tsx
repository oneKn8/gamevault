"use client";

import { useEffect, useRef, useCallback } from "react";
import { GameHost } from "@gamevault/game-sdk";

interface GameEmbedProps {
  gameId: string;
  src: string;
}

export function GameEmbed({ gameId, src }: GameEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<GameHost | null>(null);

  const handleLoad = useCallback(() => {
    if (!iframeRef.current) return;

    const host = new GameHost({
      onReady: (version) => {
        console.log(`[GameVault] ${gameId} v${version} ready`);
        host.sendInit(
          { id: "guest", username: "Guest", level: 1 },
          false,
        );
      },
      onScoreSubmit: (score, metadata) => {
        console.log(`[GameVault] Score submitted: ${score}`, metadata);
        // Phase 2: POST to /api/scores
      },
      onAchievementUnlock: (id) => {
        console.log(`[GameVault] Achievement unlocked: ${id}`);
      },
    });

    host.attach(iframeRef.current);
    hostRef.current = host;
  }, [gameId]);

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
    </div>
  );
}
