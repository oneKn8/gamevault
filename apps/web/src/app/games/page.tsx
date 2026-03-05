import { getGameManifests } from "@/lib/games";
import { GameCard } from "@/components/GameCard";
import Link from "next/link";

interface GamesPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const allGames = getGameManifests();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";

  // Derive categories from actual manifests
  const categorySet = new Set(allGames.map((g) => g.category));
  const categories = ["all", ...Array.from(categorySet).sort()];

  const activeCategory = params.category?.toLowerCase() ?? "all";
  const searchQuery = params.q?.toLowerCase().trim() ?? "";

  // Filter games
  let games = allGames;
  if (activeCategory !== "all") {
    games = games.filter((g) => g.category === activeCategory);
  }
  if (searchQuery) {
    games = games.filter(
      (g) =>
        g.name.toLowerCase().includes(searchQuery) ||
        g.description.toLowerCase().includes(searchQuery) ||
        g.tags?.some((t) => t.toLowerCase().includes(searchQuery)),
    );
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Browse Games",
    description:
      "Pick a game and start playing instantly. No downloads required.",
    url: `${siteUrl}/games`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: games.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}/games/${g.id}`,
        name: g.name,
      })),
    },
  };

  // Build filter URL preserving other params
  function filterHref(cat: string): string {
    const p = new URLSearchParams();
    if (cat !== "all") p.set("category", cat);
    if (searchQuery) p.set("q", searchQuery);
    const qs = p.toString();
    return `/games${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text">Browse Games</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pick a game and start playing instantly. No downloads required.
        </p>
      </div>

      {/* Search + Category filters */}
      <div className="mb-6 flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
        <form action="/games" method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search games..."
            className="rounded-lg border border-border bg-bg-raised px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          {activeCategory !== "all" && (
            <input type="hidden" name="category" value={activeCategory} />
          )}
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={filterHref(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                cat === activeCategory
                  ? "bg-accent text-white"
                  : "bg-bg-overlay text-text-muted hover:text-text"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {games.length > 0 ? (
        <div className="animate-stagger grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <div key={game.id} className="animate-slide-up">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-bg-raised p-12 text-center">
          <p className="text-text-muted">
            {searchQuery || activeCategory !== "all"
              ? "No games match your filters."
              : "No games available yet."}
          </p>
        </div>
      )}
    </div>
  );
}
