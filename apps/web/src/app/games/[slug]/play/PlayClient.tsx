"use client";

import { useRouter } from "next/navigation";
import { GameEmbed } from "@/components/GameEmbed";

interface PlayClientProps {
  gameId: string;
  gameName: string;
  gameSrc: string;
}

export function PlayClient({ gameId, gameName, gameSrc }: PlayClientProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 top-16 bg-bg">
      <GameEmbed
        gameId={gameId}
        gameName={gameName}
        src={gameSrc}
        onQuit={() => router.push(`/games/${gameId}`)}
      />
    </div>
  );
}
