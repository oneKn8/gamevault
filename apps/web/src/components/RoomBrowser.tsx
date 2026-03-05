"use client";

import { useState, useEffect, useCallback } from "react";

interface RoomInfo {
  code: string;
  gameId: string;
  playerCount: number;
  phase: string;
}

interface RoomBrowserProps {
  gameId: string;
  onJoinRoom: (roomCode: string) => void;
  onCreateRoom: () => void;
}

export function RoomBrowser({
  gameId,
  onJoinRoom,
  onCreateRoom,
}: RoomBrowserProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms?gameId=${encodeURIComponent(gameId)}`);
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleJoinByCode = () => {
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-bg-raised p-6">
      <h2 className="text-lg font-bold text-text">Multiplayer</h2>

      <button
        onClick={onCreateRoom}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/80"
      >
        Create Room
      </button>

      <div className="flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Enter room code"
          maxLength={6}
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted"
        />
        <button
          onClick={handleJoinByCode}
          disabled={!joinCode.trim()}
          className="rounded-lg bg-bg px-4 py-2 text-sm text-text hover:bg-border disabled:opacity-50"
        >
          Join
        </button>
      </div>

      {rooms.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-muted">
            Open Rooms
          </h3>
          <ul className="space-y-1">
            {rooms.map((room) => (
              <li key={room.code}>
                <button
                  onClick={() => onJoinRoom(room.code)}
                  className="flex w-full items-center justify-between rounded bg-bg px-3 py-2 text-sm hover:bg-border"
                >
                  <code className="font-mono text-accent">{room.code}</code>
                  <span className="text-text-muted">
                    {room.playerCount}/10 players
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <p className="text-center text-xs text-text-muted">
          No open rooms. Create one to start!
        </p>
      )}
    </div>
  );
}
