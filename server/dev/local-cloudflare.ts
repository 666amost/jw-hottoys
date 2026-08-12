import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

type SqlValue = string | number | bigint | Uint8Array | null;

function result<T>(results: T[], changes = 0, lastRowId = 0) {
  return { success: true, results, meta: { changed_db: changes > 0, changes, duration: 0, last_row_id: lastRowId, rows_read: results.length, rows_written: changes, served_by: "local-node-sqlite", size_after: 0 } };
}

function applyMigrations(sqlite: DatabaseSync) {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS d1_migrations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`);
  for (const name of readdirSync(resolve("database", "migrations")).filter(item => item.endsWith(".sql")).sort()) {
    if (sqlite.prepare("SELECT 1 FROM d1_migrations WHERE name=?").get(name)) continue;
    const sql = readFileSync(resolve("database", "migrations", name), "utf8");
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      sqlite.exec(sql);
      sqlite.prepare("INSERT INTO d1_migrations(name) VALUES(?)").run(name);
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}

function createD1(databasePath: string): { binding: D1Database; close: () => void } {
  mkdirSync(dirname(databasePath), { recursive: true });
  const fresh = !existsSync(databasePath);
  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  applyMigrations(sqlite);
  if (fresh) sqlite.exec(readFileSync(resolve("database", "seed.sql"), "utf8"));

  const prepare = (query: string, values: SqlValue[] = []) => {
    const execute = () => {
      const statement = sqlite.prepare(query);
      if (statement.columns().length) return result(statement.all(...values));
      const info = statement.run(...values);
      return result([], Number(info.changes), Number(info.lastInsertRowid));
    };
    return {
      bind: (...bindings: SqlValue[]) => prepare(query, bindings),
      first: async (column?: string) => {
        const row = sqlite.prepare(query).get(...values) as Record<string, unknown> | undefined;
        return column ? (row?.[column] ?? null) : (row ?? null);
      },
      all: async () => result(sqlite.prepare(query).all(...values)),
      run: async () => execute(),
      raw: async (options?: { columnNames?: boolean }) => {
        const statement = sqlite.prepare(query);
        const columns = statement.columns().map(item => item.name);
        const rows = statement.all(...values) as Array<Record<string, unknown>>;
        const valuesOnly = rows.map(row => columns.map(column => row[column]));
        return options?.columnNames ? [columns, ...valuesOnly] : valuesOnly;
      },
      __execute: execute,
    };
  };

  const binding = {
    prepare,
    batch: async (statements: Array<ReturnType<typeof prepare>>) => {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map(statement => statement.__execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    exec: async (query: string) => { sqlite.exec(query); return { count: 1, duration: 0 }; },
    dump: async () => new ArrayBuffer(0),
    withSession: () => { throw new Error("D1 sessions are unavailable in the local Node fallback."); },
  } as unknown as D1Database;
  return { binding, close: () => sqlite.close() };
}

function createR2(): R2Bucket {
  const base = resolve(".wrangler", "local-r2", "product-images");
  const pathFor = (key: string) => {
    const path = resolve(base, key.replaceAll("/", sep));
    if (path !== base && !path.startsWith(`${base}${sep}`)) throw new Error("R2 key tidak valid.");
    return path;
  };
  return {
    put: async (key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null, options?: R2PutOptions) => {
      let data: Uint8Array;
      if (typeof value === "string") data = new TextEncoder().encode(value);
      else if (value instanceof ReadableStream) data = new Uint8Array(await new Response(value).arrayBuffer());
      else if (value instanceof ArrayBuffer) data = new Uint8Array(value);
      else if (ArrayBuffer.isView(value)) data = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      else data = new Uint8Array();
      const path = pathFor(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, data);
      const metadata = options?.httpMetadata instanceof Headers
        ? { contentType: options.httpMetadata.get("content-type") || undefined, cacheControl: options.httpMetadata.get("cache-control") || undefined }
        : options?.httpMetadata;
      await writeFile(`${path}.metadata.json`, JSON.stringify(metadata || {}), "utf8");
      const etag = createHash("sha1").update(data).digest("hex");
      return { key, version: etag, size: data.byteLength, etag, httpEtag: `"${etag}"`, uploaded: new Date() };
    },
    get: async (key: string) => {
      const path = pathFor(key);
      try {
        const data = await readFile(path);
        const httpMetadata = JSON.parse(await readFile(`${path}.metadata.json`, "utf8").catch(() => "{}"));
        const etag = createHash("sha1").update(data).digest("hex");
        const bytes = () => new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
        return { key, version: etag, size: data.byteLength, etag, httpEtag: `"${etag}"`, uploaded: new Date(), httpMetadata, body: new Blob([bytes()]).stream(), bodyUsed: false, arrayBuffer: async () => bytes().buffer, bytes: async () => bytes(), text: async () => new TextDecoder().decode(data), json: async <T>() => JSON.parse(new TextDecoder().decode(data)) as T, blob: async () => new Blob([bytes()]), writeHttpMetadata: () => {} };
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
        throw error;
      }
    },
    head: async () => { throw new Error("Gunakan get() pada R2 fallback lokal."); },
    delete: async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) { const path = pathFor(key); await Promise.all([rm(path, { force: true }), rm(`${path}.metadata.json`, { force: true })]); } },
    list: async () => ({ objects: [], truncated: false, delimitedPrefixes: [] }),
    createMultipartUpload: async () => { throw new Error("Multipart upload tidak tersedia pada fallback lokal."); },
    resumeMultipartUpload: () => { throw new Error("Multipart upload tidak tersedia pada fallback lokal."); },
  } as unknown as R2Bucket;
}

export default defineNitroPlugin((nitroApp) => {
  const wrangler = readFileSync(resolve("wrangler.web.jsonc"), "utf8");
  const databaseId = wrangler.match(/"database_id"\s*:\s*"([^"]+)"/)?.[1];
  if (!databaseId) throw new Error("database_id tidak ditemukan di wrangler.web.jsonc.");
  const localD1 = createD1(resolve(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", `${databaseId}.sqlite`));
  const queue = { send: async () => {}, sendBatch: async () => {} } as unknown as Queue;
  const values = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(NUXT_PUBLIC_|BETTER_AUTH_|GOOGLE_|R2_|SUMOPOD_|BCE_)/.test(key)));
  const env = { ...values, DB: localD1.binding, PRODUCT_IMAGES: createR2(), SHIPMENT_QUEUE: queue, TRACKING_QUEUE: queue } as unknown as CloudflareBindings;

  console.warn("[cloudflare-dev] Menggunakan fallback Node SQLite/R2 lokal. Queue send disimulasikan tanpa consumer.");
  nitroApp.hooks.hook("request", (event) => {
    event.context.cloudflare = { request: event.req as unknown as Request, env, context: { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as unknown as ExecutionContext };
  });
  nitroApp.hooks.hook("close", localD1.close);
});
