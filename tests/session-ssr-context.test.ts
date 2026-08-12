import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const sessionComposable = readFileSync(resolve(root, "app/composables/use-session.ts"), "utf8");

describe("session SSR requests", () => {
  it("preserves Cloudflare bindings and cookies in internal requests", () => {
    expect(sessionComposable).toContain('useRequestFetch()("/api/session")');
    expect(sessionComposable).not.toContain('await $fetch("/api/session")');
  });
});
