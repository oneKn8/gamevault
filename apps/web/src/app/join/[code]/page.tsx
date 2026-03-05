import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // Phase 3: Look up room code in Redis -> redirect to game
  void code;
  redirect("/");
}
