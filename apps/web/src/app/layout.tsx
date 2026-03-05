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
  title: "GameVault - Multiplayer Browser Games",
  description: "Open-source multiplayer browser game hub. Play classic games with friends instantly.",
  keywords: ["games", "multiplayer", "browser games", "arcade"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
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
