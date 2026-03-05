"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RoomBrowser } from "@/components/RoomBrowser";
import { LobbyPanel } from "@/components/LobbyPanel";
import { GameEmbed } from "@/components/GameEmbed";

const GAME_SERVER_URL =
  process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "http://localhost:3100";

interface MultiplayerPlayClientProps {
  gameId: string;
  gameName: string;
  gameSrc: string;
}

type Phase = "browse" | "lobby" | "playing";

export function MultiplayerPlayClient({
  gameId,
  gameName,
  gameSrc,
}: MultiplayerPlayClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [phase, setPhase] = useState<Phase>("browse");
  const [roomCode, setRoomCode] = useState("");

  const username = session?.user?.username ?? "Guest";

  const handleCreateRoom = useCallback(async () => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (data.code) {
        setRoomCode(data.code);
        setPhase("lobby");
      }
    } catch {
      // ignore
    }
  }, [gameId]);

  const handleJoinRoom = useCallback((code: string) => {
    setRoomCode(code);
    setPhase("lobby");
  }, []);

  const handleGameStart = useCallback(() => {
    setPhase("playing");
  }, []);

  if (phase === "playing") {
    return (
      <div className="fixed inset-0 top-16 bg-bg">
        <GameEmbed
          gameId={gameId}
          gameName={gameName}
          src={gameSrc}
          onQuit={() => router.push(`/games/${gameId}`)}
          multiplayerConfig={{
            serverUrl: GAME_SERVER_URL,
            roomCode,
          }}
        />
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <LobbyPanel
          roomCode={roomCode}
          serverUrl={GAME_SERVER_URL}
          username={username}
          onGameStart={handleGameStart}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <RoomBrowser
        gameId={gameId}
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}
