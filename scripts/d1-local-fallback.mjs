import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openLocalD1, runTransaction } from "./local-d1.mjs";

const mode = process.argv[2];
if (!new Set(["migrate", "seed", "verify"]).has(mode)) {
  console.error("Usage: node scripts/d1-local-fallback.mjs migrate|seed|verify");
  process.exit(1);
}

const { db, databasePath } = await openLocalD1();

if (mode === "migrate") {
  db.exec(`CREATE TABLE IF NOT EXISTS d1_migrations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );`);
  const migrationDirectory = resolve("database", "migrations");
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of migrations) {
    const applied = db.prepare("SELECT 1 FROM d1_migrations WHERE name=?").get(name);
    if (applied) continue;
    const sql = await readFile(resolve(migrationDirectory, name), "utf8");
    runTransaction(db, `${sql}\nINSERT INTO d1_migrations(name) VALUES('${name.replaceAll("'", "''")}');`);
    console.log(`Migration ${name} applied.`);
  }
}

if (mode === "seed") {
  db.exec(await readFile(resolve("database", "seed.sql"), "utf8"));
  console.log("Seed applied.");
}

const summary = db.prepare(`SELECT
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%') tables,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger') triggers,
  (SELECT COUNT(*) FROM categories) categories,
  (SELECT COUNT(*) FROM products) products,
  (SELECT COUNT(*) FROM product_variants) variants,
  (SELECT COUNT(*) FROM site_announcements) announcements
`).get();
console.log({ databasePath, ...summary });
db.close();
