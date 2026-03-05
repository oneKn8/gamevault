import type { Metadata } from "next";
import { Orbitron, Press_Start_2P } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const pressStart = Press_Start_2P({
  variable: "--font-retro",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "GameVault - Multiplayer Browser Games",
  description: "Open-source multiplayer browser game hub with a neon cyberpunk aesthetic. Play classic games with friends instantly.",
  keywords: ["games", "multiplayer", "browser games", "arcade", "neon"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${orbitron.variable} ${pressStart.variable} antialiased min-h-screen`}
      >
        <header className="sticky top-0 z-50 border-b border-neon-blue/20 bg-neon-bg/80 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wider text-neon-yellow">
                GAME
              </span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wider text-neon-blue">
                VAULT
              </span>
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/games"
                className="text-sm text-hud-label transition-colors hover:text-hud-text"
              >
                Games
              </a>
              <a
                href="/leaderboards"
                className="text-sm text-hud-label transition-colors hover:text-hud-text"
              >
                Leaderboards
              </a>
              <button className="rounded-md border border-neon-blue/40 bg-neon-blue/10 px-4 py-1.5 text-sm font-medium text-neon-blue transition-all hover:bg-neon-blue/20 hover:shadow-neon-blue">
                Sign In
              </button>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
