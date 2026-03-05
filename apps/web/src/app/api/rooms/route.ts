import { NextResponse } from "next/server";

const GAME_SERVER_URL =
  process.env.GAME_SERVER_URL ?? "http://localhost:3100";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${GAME_SERVER_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: body.gameId }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Game server unavailable" },
      { status: 503 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId") ?? "";
    const res = await fetch(
      `${GAME_SERVER_URL}/rooms?gameId=${encodeURIComponent(gameId)}`,
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Game server unavailable" },
      { status: 503 },
    );
  }
}
