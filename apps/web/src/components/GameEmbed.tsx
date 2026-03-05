"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { GameHost } from "@gamevault/game-sdk";

interface GameEmbedProps {
  gameId: string;
  gameName: string;
  src: string;
  onQuit: () => void;
}

export function GameEmbed({ gameId, gameName, src, onQuit }: GameEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hostRef = useRef<GameHost | null>(null);
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);

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

  const togglePause = () => {
    if (paused) {
      hostRef.current?.sendResume();
    } else {
      hostRef.current?.sendPause();
    }
    setPaused(!paused);
  };

  const toggleMute = () => {
    const next = !muted;
    hostRef.current?.sendMute(next);
    setMuted(next);
  };

  const enterFullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* HUD bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-bg-raised px-4">
        <a
          href={`/games/${gameId}`}
          className="text-xs text-text-muted hover:text-text"
        >
          &larr; {gameName}
        </a>
        <div className="flex items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            title={paused ? "Resume" : "Pause"}
            className="rounded p-1.5 text-text-muted hover:bg-bg hover:text-text"
          >
            {paused ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2l10 6-10 6V2z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" />
                <rect x="9" y="2" width="4" height="12" />
              </svg>
            )}
          </button>

          {/* Mute / Unmute */}
          <button
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            className="rounded p-1.5 text-text-muted hover:bg-bg hover:text-text"
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2L4 6H1v4h3l4 4V2z" />
                <line x1="12" y1="5" x2="15" y2="11" stroke="currentColor" strokeWidth="1.5" />
                <line x1="15" y1="5" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 2L4 6H1v4h3l4 4V2z" />
                <path d="M11 5.5a3.5 3.5 0 010 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 3.5a6.5 6.5 0 010 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={enterFullscreen}
            title="Fullscreen"
            className="rounded p-1.5 text-text-muted hover:bg-bg hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="1,5 1,1 5,1" />
              <polyline points="11,1 15,1 15,5" />
              <polyline points="15,11 15,15 11,15" />
              <polyline points="5,15 1,15 1,11" />
            </svg>
          </button>

          {/* Quit */}
          <button
            onClick={onQuit}
            title="Quit"
            className="rounded p-1.5 text-text-muted hover:bg-bg hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Game iframe */}
      <div className="relative min-h-0 flex-1">
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
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-accent/30 bg-bg/90 px-4 py-2 text-sm text-accent backdrop-blur-sm">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
