import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function getLocalD1Path() {
  const wrangler = await readFile(resolve("wrangler.web.jsonc"), "utf8");
  const databaseId = wrangler.match(/"database_id"\s*:\s*"([^"]+)"/)?.[1];
  if (!databaseId) throw new Error("database_id tidak ditemukan di wrangler.web.jsonc.");
  return resolve(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", `${databaseId}.sqlite`);
}

export async function openLocalD1() {
  const databasePath = await getLocalD1Path();
  await mkdir(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  return { db, databasePath };
}

export function runTransaction(db, sql) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(sql);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
