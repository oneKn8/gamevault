import type { GameManifest } from "@gamevault/shared-types";
import fs from "fs";
import path from "path";

const GAMES_DIR = path.resolve(process.cwd(), "../../games");

// Reads all game manifests from games/{name}/manifest.json at build time
export function getGameManifests(): GameManifest[] {
  const games: GameManifest[] = [];

  if (!fs.existsSync(GAMES_DIR)) return games;

  const dirs = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const manifestPath = path.join(GAMES_DIR, dir.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = fs.readFileSync(manifestPath, "utf-8");
      const manifest: GameManifest = JSON.parse(raw);
      games.push(manifest);
    } catch {
      console.warn(`Failed to parse manifest for ${dir.name}`);
    }
  }

  return games.sort((a, b) => a.name.localeCompare(b.name));
}

export function getGameBySlug(slug: string): GameManifest | undefined {
  const manifests = getGameManifests();
  return manifests.find((g) => g.id === slug);
}
