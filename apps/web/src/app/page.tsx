import { getGameManifests } from "@/lib/games";
import { GameCard } from "@/components/GameCard";
import { HeroCarousel } from "@/components/HeroCarousel";

export default function HomePage() {
  const games = getGameManifests();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GameVault Games",
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/games/${g.id}`,
      name: g.name,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">GameVault - Free Browser Games</h1>
      {/* Hero Carousel */}
      <section className="mb-12 animate-fade-in">
        <HeroCarousel games={games} />
      </section>

      {/* Featured Games - horizontal scroll */}
      {games.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-text">Featured</h2>
          <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
            {games.map((game) => (
              <div key={game.id} className="w-56 flex-shrink-0">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Games grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">All Games</h2>
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
            <p className="text-text-muted">No games available yet. Check back soon.</p>
          </div>
        )}
      </section>
    </div>
  );
}
