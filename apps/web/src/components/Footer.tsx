import Link from "next/link";
import { getGameManifests } from "@/lib/games";

export function Footer() {
  const games = getGameManifests();

  const columns = [
    {
      title: "Games",
      links: games.map((g) => ({ label: g.name, href: `/games/${g.id}` })),
    },
    {
      title: "Community",
      links: [
        { label: "Leaderboards", href: "/leaderboards" },
        { label: "GitHub", href: "https://github.com/oneKn8/gamevault" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "How to Play", href: "/games" },
        { label: "Add a Game", href: "https://github.com/oneKn8/gamevault" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-bg-raised">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Branding */}
          <div>
            <div className="mb-4 flex items-center gap-1">
              <span className="text-lg font-bold tracking-wider text-text">GAME</span>
              <span className="text-lg font-bold tracking-wider text-accent">VAULT</span>
            </div>
            <p className="mb-4 text-sm text-text-muted">
              Open-source multiplayer browser games. No downloads required.
            </p>
            <a
              href="https://github.com/oneKn8/gamevault"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary transition-colors hover:text-text"
            >
              Star on GitHub
            </a>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-text-muted transition-colors hover:text-text"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-muted transition-colors hover:text-text"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-text-muted">
          <p>GameVault is open-source software. Built with Next.js, Canvas 2D, and TypeScript.</p>
        </div>
      </div>
    </footer>
  );
}
