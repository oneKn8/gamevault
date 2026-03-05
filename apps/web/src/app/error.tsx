"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-bg-raised p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-text">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-text-muted">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
