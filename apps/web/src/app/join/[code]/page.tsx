import { redirect } from "next/navigation";

const GAME_SERVER_URL =
  process.env.GAME_SERVER_URL ?? "http://localhost:3100";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  try {
    const res = await fetch(`${GAME_SERVER_URL}/rooms/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const room = await res.json();
      redirect(`/games/${room.gameId}/play?mode=multiplayer&room=${code}`);
    }
  } catch {
    // Game server unavailable
  }

  redirect("/");
}
