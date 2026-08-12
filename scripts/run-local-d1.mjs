import { spawnSync } from "node:child_process";
import { release } from "node:os";
import { resolve } from "node:path";

const mode = process.argv[2];
if (!new Set(["migrate", "seed"]).has(mode)) {
  console.error("Usage: node scripts/run-local-d1.mjs migrate|seed");
  process.exit(1);
}

const windowsBuild = Number(release().split(".")[2] || 0);
const workerdSupported = process.platform !== "win32" || windowsBuild >= 22000;
const forceFallback = process.env.JWLAB_LOCAL_FALLBACK === "1" || process.env.NUXT_CLOUDFLARE_DEV === "false";

let args;
if (!workerdSupported || forceFallback) {
  console.log("Menggunakan D1 fallback Node SQLite untuk Windows lokal.");
  args = [resolve("scripts", "d1-local-fallback.mjs"), mode];
} else if (mode === "migrate") {
  args = [resolve("node_modules", "wrangler", "bin", "wrangler.js"), "d1", "migrations", "apply", "jwlab-studio", "--local", "--config", "wrangler.web.jsonc"];
} else {
  args = [resolve("node_modules", "wrangler", "bin", "wrangler.js"), "d1", "execute", "jwlab-studio", "--local", "--file=database/seed.sql", "--config", "wrangler.web.jsonc"];
}

const result = spawnSync(process.execPath, args, { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
