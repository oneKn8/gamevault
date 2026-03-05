export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero skeleton */}
      <div className="mb-12 min-h-[420px] animate-pulse rounded-xl bg-bg-raised">
        <div className="flex min-h-[420px] items-end p-8">
          <div className="space-y-3">
            <div className="h-5 w-20 rounded-full bg-bg" />
            <div className="h-8 w-64 rounded bg-bg" />
            <div className="h-4 w-80 rounded bg-bg" />
            <div className="mt-4 h-10 w-28 rounded-lg bg-bg" />
          </div>
        </div>
      </div>

      {/* "All Games" heading skeleton */}
      <div className="mb-4 h-5 w-24 animate-pulse rounded bg-bg-raised" />

      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-border bg-bg-raised">
            <div className="aspect-[3/4] animate-pulse bg-bg" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-bg" />
              <div className="h-3 w-full animate-pulse rounded bg-bg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
