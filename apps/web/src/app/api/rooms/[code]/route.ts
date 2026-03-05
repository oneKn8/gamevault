import { NextResponse } from "next/server";

const GAME_SERVER_URL =
  process.env.GAME_SERVER_URL ?? "http://localhost:3100";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const res = await fetch(`${GAME_SERVER_URL}/rooms/${encodeURIComponent(code)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Game server unavailable" },
      { status: 503 },
    );
  }
}
