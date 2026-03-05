# GameVault

Open-source multiplayer browser game hub with a neon cyberpunk aesthetic. Play classic and original games in your browser, compete on leaderboards, and earn achievements.

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Portal**: Next.js 16 (App Router) with Tailwind CSS 4
- **Games**: Raw Canvas 2D + esbuild, embedded via iframe with a postMessage SDK
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM
- **Auth**: Auth.js v5 (GitHub, Google, Discord)
- **Cache**: Upstash Redis (leaderboard sorted sets)

## Project Structure

```
gamevault/
  apps/web/          Next.js portal
  games/             Individual game packages
  packages/
    config/          Shared TypeScript configs
    db/              Drizzle schema + Neon client
    game-sdk/        iframe postMessage bridge
    neon-theme/      Colors, Tailwind preset, canvas utils
    shared-types/    Cross-package TypeScript types
```

## Getting Started

```bash
pnpm install
pnpm dev
```

The portal runs at `http://localhost:3001`.

### Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your credentials.

## Games

Each game lives in `games/<name>/` with its own `manifest.json`, esbuild config, and Canvas 2D rendering. Games communicate with the portal via the `@gamevault/game-sdk` postMessage bridge.

## License

MIT
