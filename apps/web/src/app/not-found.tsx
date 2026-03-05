import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-bg-raised p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-text">
          404 -- Page not found
        </h1>
        <p className="mb-6 text-sm text-text-muted">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/games"
          className="inline-block rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Back to games
        </Link>
      </div>
    </div>
  );
}
