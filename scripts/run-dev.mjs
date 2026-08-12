import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const [major, minor] = process.versions.node.split(".").map(Number);
if (major !== 24 || minor < 11) {
  console.error(`Node.js 24.11+ diperlukan. Versi aktif: ${process.version}`);
  console.error("Pasang Node.js 24 LTS, buka terminal baru, lalu ulangi npm run dev.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [resolve("node_modules", "nuxt", "bin", "nuxt.mjs"), "dev", ...process.argv.slice(2)], {
  env: { ...process.env, JWLAB_LOCAL_FALLBACK: "1" },
  stdio: "inherit",
});
process.exit(result.status ?? 1);
