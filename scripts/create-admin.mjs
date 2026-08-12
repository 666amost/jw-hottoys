import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { rm, writeFile, mkdir } from "node:fs/promises";
import { release } from "node:os";
import { Writable } from "node:stream";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "better-auth/crypto";
import { createAdminSql, parseAdminMode } from "./admin-account.mjs";
import { openLocalD1, runTransaction } from "./local-d1.mjs";

const parsedMode = parseAdminMode(process.argv.slice(2));
if (process.argv.includes("--help") || !parsedMode) {
  console.log("Usage: npm run admin:create:local | npm run admin:create:remote");
  process.exit(process.argv.includes("--help") ? 0 : 1);
}
if (parsedMode.mode === "remote" && parsedMode.fallback) throw new Error("Fallback hanya tersedia untuk D1 lokal.");

let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
const email = (await rl.question("Email admin: ")).trim().toLowerCase();
const name = (await rl.question("Nama admin: ")).trim() || "JWLAB Admin";
process.stdout.write("Password admin (minimal 12 karakter): ");
muted = Boolean(process.stdin.isTTY);
const password = await rl.question("");
muted = false;
process.stdout.write("\n");
rl.close();

if (!email.includes("@") || password.length < 12) throw new Error("Email tidak valid atau password kurang dari 12 karakter.");

const now = Date.now();
const hash = await hashPassword(password);
const generatedUserId = randomUUID();
const sql = createAdminSql({ email, name, passwordHash: hash, now, userId: generatedUserId, accountId: randomUUID() });

const windowsBuild = Number(release().split(".")[2] || 0);
const localFallback = parsedMode.mode === "local" && (
  parsedMode.fallback
  || process.env.JWLAB_LOCAL_FALLBACK === "1"
  || process.env.NUXT_CLOUDFLARE_DEV === "false"
  || (process.platform === "win32" && windowsBuild < 22000)
);

if (localFallback) {
  const { db, databasePath } = await openLocalD1();
  try {
    runTransaction(db, sql);
    console.log(`Admin owner ${email} berhasil dibuat (D1 fallback lokal: ${databasePath}).`);
  } finally {
    db.close();
  }
} else {
  await mkdir(".tmp", { recursive: true });
  const sqlPath = `.tmp/admin-${generatedUserId}.sql`;
  await writeFile(sqlPath, sql, { encoding: "utf8", mode: 0o600 });
  try {
    const executable = process.platform === "win32" ? "npx.cmd" : "npx";
    const flag = parsedMode.mode === "remote" ? "--remote" : "--local";
    const result = spawnSync(executable, ["wrangler", "d1", "execute", "jwlab-studio", flag, `--file=${sqlPath}`, "--config", "wrangler.web.jsonc"], { stdio: "inherit" });
    if (result.status !== 0) process.exitCode = result.status ?? 1;
    else console.log(`Admin owner ${email} berhasil dibuat (${parsedMode.mode}).`);
  } finally {
    await rm(sqlPath, { force: true });
  }
}
