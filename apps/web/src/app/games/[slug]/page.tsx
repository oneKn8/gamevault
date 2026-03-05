import type { Metadata } from "next";
import { getGameBySlug, getGameManifests } from "@/lib/games";
import { gameFaqs } from "@/lib/game-faqs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NeonButton } from "@/components/NeonButton";
import { Leaderboard } from "@/components/Leaderboard";
import { GameCover } from "@/components/covers";

export function generateStaticParams() {
  return getGameManifests().map((g) => ({ slug: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};
  return {
    title: game.name,
    description: game.description,
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";
  const gameUrl = `${siteUrl}/games/${game.id}`;

  const videoGameJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.description,
    url: gameUrl,
    image: `${siteUrl}${game.thumbnail}`,
    playMode: game.multiplayer ? "MultiPlayer" : "SinglePlayer",
    gamePlatform: "Web Browser",
    genre: game.category,
    applicationCategory: "Game",
    operatingSystem: "Any",
    inLanguage: "en",
    datePublished: "2025-01-01",
    author: {
      "@type": "Organization",
      name: "GameVault",
    },
    keywords: game.tags.join(", "),
    ...(game.multiplayer && {
      numberOfPlayers: {
        "@type": "QuantitativeValue",
        minValue: game.multiplayer.minPlayers,
        maxValue: game.multiplayer.maxPlayers,
      },
    }),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Games",
        item: `${siteUrl}/games`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.name,
        item: gameUrl,
      },
    ],
  };

  const faqs = gameFaqs[game.id] ?? [];
  const faqJsonLd = faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoGameJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <Link href="/" className="hover:text-text">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/games" className="hover:text-text">
              Games
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span className="text-text" aria-current="page">
              {game.name}
            </span>
          </li>
        </ol>
      </nav>

      <article>
        {/* Cover banner */}
        <div className="relative mb-8 h-48 overflow-hidden rounded-xl">
          <GameCover gameId={game.id} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-text">{game.name}</h1>
          <p className="mb-4 text-text-muted">{game.description}</p>

          <div className="flex items-center gap-3">
            <Link href={`/games/${game.id}/play`}>
              <NeonButton variant="highlight">Play Now</NeonButton>
            </Link>
            {game.multiplayer && game.multiplayer.maxPlayers > 1 && (
              <>
                <Link href={`/games/${game.id}/play?mode=multiplayer`}>
                  <NeonButton variant="highlight">Multiplayer</NeonButton>
                </Link>
                <span className="text-sm text-text-muted">
                  {game.multiplayer.minPlayers}-{game.multiplayer.maxPlayers}{" "}
                  players ({game.multiplayer.modes.join(", ")})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-8 flex flex-wrap gap-2">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border px-2 py-0.5 text-xs text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Leaderboard */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Leaderboard</h2>
          <Leaderboard gameId={game.id} />
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-text">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-lg border border-border bg-bg-raised"
                >
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-text hover:text-accent">
                    {faq.question}
                  </summary>
                  <p className="px-4 pb-3 text-sm text-text-muted">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
