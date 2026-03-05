import { getGameManifests } from "@/lib/games";
import { GameCard } from "@/components/GameCard";

const categories = ["All", "Arcade", "Strategy", "Puzzle", "Party"];

export default function GamesPage() {
  const games = getGameManifests();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";

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

      {/* Category filter pills (visual only) */}
      <div className="mb-6 flex gap-2 overflow-x-auto py-3">
        {categories.map((cat, i) => (
          <span
            key={cat}
            className={`cursor-default whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              i === 0
                ? "bg-accent text-white"
                : "bg-bg-overlay text-text-muted hover:text-text"
            }`}
          >
            {cat}
          </span>
        ))}
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
          <p className="text-text-muted">No games available yet.</p>
        </div>
      )}
    </div>
  );
}
