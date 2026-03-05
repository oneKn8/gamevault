import type { MetadataRoute } from "next";
import { getGameManifests } from "@/lib/games";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";

  const games = getGameManifests();

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/games`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/leaderboards`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    ...games.map((g) => ({
      url: `${base}/games/${g.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
