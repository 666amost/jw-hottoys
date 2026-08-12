import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAdminSql, parseAdminMode } from "../scripts/admin-account.mjs";

const schema = readFileSync(resolve(import.meta.dirname, "../database/migrations/0001_initial.sql"), "utf8");
const fixBetterAuthDates = readFileSync(resolve(import.meta.dirname, "../database/migrations/0003_fix_better_auth_dates.sql"), "utf8");

describe("admin:create", () => {
  it("accepts positional and legacy npm arguments", () => {
    expect(parseAdminMode(["local"])).toEqual({ mode: "local", fallback: false });
    expect(parseAdminMode(["--local", "--fallback"])).toEqual({ mode: "local", fallback: true });
    expect(parseAdminMode(["remote"])).toEqual({ mode: "remote", fallback: false });
    expect(parseAdminMode([])).toBeNull();
    expect(parseAdminMode(["local", "remote"])).toBeNull();
  });

  it("updates an existing credential and always grants owner idempotently", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(schema);
    db.exec(fixBetterAuthDates);
    db.exec(createAdminSql({ email: "owner@example.test", name: "First", passwordHash: "hash-1", now: 1, userId: "user-1", accountId: "account-1" }));
    db.exec(createAdminSql({ email: "owner@example.test", name: "Owner", passwordHash: "hash-2", now: 2, userId: "ignored-user", accountId: "ignored-account" }));
    expect(db.prepare("SELECT id,name FROM user WHERE email='owner@example.test'").get()).toEqual({ id: "user-1", name: "Owner" });
    expect(db.prepare("SELECT password FROM account WHERE providerId='credential' AND accountId='user-1'").get()).toEqual({ password: "hash-2" });
    expect(db.prepare("SELECT role FROM admin_roles WHERE user_id='user-1'").get()).toEqual({ role: "owner" });
    expect(db.prepare("SELECT COUNT(*) count FROM user").get()).toEqual({ count: 1 });
    db.close();
  });
});
