import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve(".env.example");
const targetPath = resolve(".env.local");
const template = await readFile(sourcePath, "utf8");
const templateVariables = [...template.matchAll(/^([A-Z][A-Z0-9_]*)=(.*)$/gm)].map((match) => ({ key: match[1], value: match[2] }));

let existing = "";
let created = false;
try {
  existing = await readFile(targetPath, "utf8");
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") created = true;
  else throw error;
}

let content = created ? template : existing;
const existingKeys = new Set([...content.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]));
const missing = templateVariables.filter(({ key }) => !existingKeys.has(key));
if (missing.length) {
  const additions = missing.map(({ key, value }) => `${key}=${value}`).join("\n");
  content = `${content.trimEnd()}\n\n# Nuxt/Cloudflare variables added by npm run env:setup\n${additions}\n`;
}

const secret = randomBytes(48).toString("base64url");
if (/^BETTER_AUTH_SECRET=\s*$/m.test(content)) content = content.replace(/^BETTER_AUTH_SECRET=\s*$/m, `BETTER_AUTH_SECRET=${secret}`);
if (!/^BETTER_AUTH_SECRET=.+$/m.test(content)) throw new Error("BETTER_AUTH_SECRET gagal disiapkan.");

if (created || content !== existing) {
  await writeFile(targetPath, content, { encoding: "utf8", mode: 0o600 });
  console.log(created ? ".env.local berhasil dibuat." : ".env.local diperbarui tanpa mengubah nilai yang sudah ada.");
  console.log("BETTER_AUTH_SECRET tersedia tanpa ditampilkan.");
} else {
  console.log(".env.local sudah lengkap; file tidak diubah.");
}
console.log("Isi kredensial Google, SumoPod, dan BCE saat integrasinya akan diuji.");
