import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/join/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
