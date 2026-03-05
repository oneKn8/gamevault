import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Copy SVG pieces from src to dist
const piecesSrc = resolve(__dirname, "../src/pieces");
const piecesDist = resolve(__dirname, "../dist/pieces");
mkdirSync(piecesDist, { recursive: true });
cpSync(piecesSrc, piecesDist, { recursive: true });
console.log(`Copied src/pieces/ -> dist/pieces/`);

// Copy entire dist to portal public
const src = resolve(__dirname, "../dist");
const dest = resolve(__dirname, "../../../apps/web/public/games/chess");
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied dist/ -> ${dest}`);
