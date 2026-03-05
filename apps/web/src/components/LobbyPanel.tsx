"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface LobbyPlayer {
  id: string;
  username: string;
  ready?: boolean;
}

interface LobbyPanelProps {
  roomCode: string;
  serverUrl: string;
  username: string;
  onGameStart: () => void;
}

export function LobbyPanel({
  roomCode,
  serverUrl,
  username,
  onGameStart,
}: LobbyPanelProps) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [phase, setPhase] = useState<string>("waiting");
  const wsRef = useRef<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wsUrl = serverUrl.replace(/^http/, "ws");
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "JOIN_ROOM",
          roomCode,
          username,
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "ROOM_STATE":
            setPlayers(
              msg.players.map((p: { id: string; username: string; ready?: boolean }) => ({
                id: p.id,
                username: p.username,
                ready: p.ready,
              })),
            );
            setPhase(msg.phase);
            break;
          case "GAME_START":
            onGameStart();
            break;
          case "ERROR":
            setError(msg.message);
            break;
        }
      } catch {
        // ignore
      }
    };

    socket.onclose = () => {
      setError("Disconnected from server");
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [serverUrl, roomCode, username, onGameStart]);

  const handleReady = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "READY" }));
      setIsReady(true);
    }
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
  }, [roomCode]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-bg-raised p-6">
      <h2 className="mb-1 text-lg font-bold text-text">Game Lobby</h2>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-text-muted">Room Code:</span>
        <code className="rounded bg-bg px-2 py-0.5 text-sm font-mono text-accent">
          {roomCode}
        </code>
        <button
          onClick={handleCopyCode}
          className="rounded px-2 py-0.5 text-xs text-text-muted hover:text-text"
        >
          Copy
        </button>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-text-muted">
          Players ({players.length}/10)
        </h3>
        <ul className="space-y-1">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded bg-bg px-3 py-1.5 text-sm"
            >
              <span className="text-text">{p.username}</span>
              {p.ready && (
                <span className="text-xs text-green-400">Ready</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {phase === "waiting" && (
        <button
          onClick={handleReady}
          disabled={isReady}
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium ${
            isReady
              ? "bg-green-900/30 text-green-400"
              : "bg-accent text-white hover:bg-accent/80"
          }`}
        >
          {isReady ? "Waiting for others..." : "Ready Up"}
        </button>
      )}

      {phase === "countdown" && (
        <p className="text-center text-sm text-accent">Starting soon...</p>
      )}
    </div>
  );
}
