import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const middleware = readFileSync(resolve(root, "server/middleware/private-api-cache.ts"), "utf8");
const session = readFileSync(resolve(root, "server/api/session.get.ts"), "utf8");

describe("private API cache protection", () => {
  it("marks authenticated API families as private and non-cacheable", () => {
    for (const path of ["/api/account", "/api/admin", "/api/auth", "/api/checkout", "/api/orders", "/api/session"]) {
      expect(middleware).toContain(`"${path}"`);
    }
    expect(middleware).toContain('"Cloudflare-CDN-Cache-Control", "no-store"');
    expect(middleware).toContain('"Vary", "Cookie, Authorization"');
  });

  it("protects the session endpoint directly as defense in depth", () => {
    expect(session).toContain('"Cache-Control", "private, no-store, no-cache, max-age=0, must-revalidate"');
    expect(session).toContain('"Cloudflare-CDN-Cache-Control", "no-store"');
  });
});
