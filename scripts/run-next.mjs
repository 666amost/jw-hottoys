import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const nextCli = resolve("node_modules", "next", "dist", "bin", "next");
const localRootCa = resolve(".certificates", "local-root-ca.pem");
const env = { ...process.env };

if (existsSync(localRootCa) && !env.NODE_EXTRA_CA_CERTS) {
  env.NODE_EXTRA_CA_CERTS = localRootCa;
}

const child = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("[next-runner] Gagal menjalankan Next.js:", error);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
