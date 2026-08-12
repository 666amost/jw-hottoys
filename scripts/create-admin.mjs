import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { rm, writeFile, mkdir } from "node:fs/promises";
import { release } from "node:os";
import { resolve } from "node:path";
import { emitKeypressEvents } from "node:readline";
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

function readMaskedLine(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    const fallback = createInterface({ input: process.stdin, output: process.stdout });
    return fallback.question(prompt).finally(() => fallback.close());
  }

  return new Promise((resolve) => {
    let value = "";
    const wasRaw = Boolean(process.stdin.isRaw);

    const finish = (result) => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(wasRaw);
      process.stdin.pause();
      process.stdout.write("\n");
      resolve(result);
    };

    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") {
        finish(null);
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        finish(value);
        return;
      }
      if (key.name === "backspace") {
        if (value.length > 0) {
          value = Array.from(value).slice(0, -1).join("");
          process.stdout.write("\b \b");
        }
        return;
      }
      if (key.ctrl || key.meta || !character) return;

      const printable = Array.from(character).filter((char) => char >= " ").join("");
      value += printable;
      process.stdout.write("*".repeat(Array.from(printable).length));
    };

    process.stdout.write(prompt);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", onKeypress);
  });
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = (await rl.question("Email admin: ")).trim().toLowerCase();
const name = (await rl.question("Nama admin: ")).trim() || "JWLAB Admin";
rl.close();

if (!email.includes("@")) throw new Error("Email admin tidak valid.");

let password;
while (!password) {
  const enteredPassword = await readMaskedLine("Password admin (minimal 12 karakter): ");
  if (enteredPassword === null) {
    console.log("Pembuatan admin dibatalkan.");
    process.exit(130);
  }
  if (enteredPassword.length < 12) {
    console.error("Password harus minimal 12 karakter. Silakan coba lagi.");
    continue;
  }
  password = enteredPassword;
}

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
    const wranglerCli = resolve("node_modules", "wrangler", "bin", "wrangler.js");
    const flag = parsedMode.mode === "remote" ? "--remote" : "--local";
    const result = spawnSync(process.execPath, [wranglerCli, "d1", "execute", "jwlab-studio", flag, `--file=${sqlPath}`, "--config", "wrangler.web.jsonc"], { stdio: "inherit" });
    if (result.error) throw new Error(`Wrangler gagal dijalankan: ${result.error.message}`, { cause: result.error });
    if (result.status !== 0) process.exitCode = result.status ?? 1;
    else console.log(`Admin owner ${email} berhasil dibuat (${parsedMode.mode}).`);
  } finally {
    await rm(sqlPath, { force: true });
  }
}
