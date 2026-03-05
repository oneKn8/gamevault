"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-neon-blue/10" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={`/profile/${session.user.username}`}
          className="flex items-center gap-2 text-sm text-hud-text transition-colors hover:text-neon-cyan"
        >
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 rounded-full border border-neon-blue/30"
            />
          )}
          <span>{session.user.username}</span>
          <span className="text-xs text-hud-dim">
            Lv.{session.user.level}
          </span>
        </a>
        <button
          onClick={() => signOut()}
          className="rounded-md border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-xs text-neon-pink transition-all hover:bg-neon-pink/20"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="rounded-md border border-neon-blue/40 bg-neon-blue/10 px-4 py-1.5 text-sm font-medium text-neon-blue transition-all hover:bg-neon-blue/20 hover:shadow-neon-blue"
    >
      Sign In
    </button>
  );
}
