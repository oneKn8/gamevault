import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { AuthButton } from "@/components/AuthButton";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg"
  ),
  title: {
    default: "GameVault - Multiplayer Browser Games",
    template: "%s | GameVault",
  },
  description:
    "Open-source multiplayer browser game hub. Play classic games with friends instantly.",
  keywords: ["games", "multiplayer", "browser games", "arcade"],
  openGraph: {
    type: "website",
    siteName: "GameVault",
    title: "GameVault - Multiplayer Browser Games",
    description:
      "Open-source multiplayer browser game hub. Play classic games with friends instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameVault - Multiplayer Browser Games",
    description:
      "Open-source multiplayer browser game hub. Play classic games with friends instantly.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GameVault",
              url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg",
              description:
                "Open-source multiplayer browser game hub. Play classic games with friends instantly.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://gamevault.gg"}/games?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-[family-name:var(--font-sans)] antialiased min-h-screen`}
      >
        <Providers>
          <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
              <a href="/" className="flex items-center gap-1">
                <span className="text-xl font-bold tracking-wider text-text">
                  GAME
                </span>
                <span className="text-xl font-bold tracking-wider text-accent">
                  VAULT
                </span>
              </a>
              <div className="flex items-center gap-6">
                <a
                  href="/games"
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Games
                </a>
                <a
                  href="/leaderboards"
                  className="text-sm text-text-secondary transition-colors hover:text-text"
                >
                  Leaderboards
                </a>
                <AuthButton />
              </div>
            </nav>
          </header>
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
