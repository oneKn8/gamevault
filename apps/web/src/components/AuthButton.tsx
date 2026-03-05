"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-accent/10" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={`/profile/${session.user.username}`}
          className="flex items-center gap-2 text-sm text-text transition-colors hover:text-accent"
        >
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.username ?? ""}
              className="h-7 w-7 rounded-full border border-border"
            />
          )}
          <span>{session.user.username}</span>
          <span className="text-xs text-text-muted">
            Lv.{session.user.level}
          </span>
        </a>
        <button
          onClick={() => signOut()}
          aria-label="Sign out"
          className="rounded-md border border-border-highlight bg-transparent px-3 py-1 text-xs text-text-secondary transition-all hover:text-text hover:border-text-muted"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      aria-label="Sign in"
      className="rounded-md border border-accent bg-accent px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
    >
      Sign In
    </button>
  );
}
