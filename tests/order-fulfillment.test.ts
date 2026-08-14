import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deliveredOrderReconciliationStatements } from "../shared/order-fulfillment";

type SqlValue = string | number | bigint | Uint8Array | null;
type TestStatement = D1PreparedStatement & { query: string; values: SqlValue[] };

function createD1(sqlite: DatabaseSync): D1Database {
  const prepare = (query: string, values: SqlValue[] = []): TestStatement => ({
    query,
    values,
    bind: (...bindings: SqlValue[]) => prepare(query, bindings),
  }) as unknown as TestStatement;
  return {
    prepare,
    batch: async (statements: D1PreparedStatement[]) => {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        for (const raw of statements) {
          const statement = raw as TestStatement;
          sqlite.prepare(statement.query).run(...statement.values);
        }
        sqlite.exec("COMMIT");
        return [];
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}

describe("delivered order reconciliation", () => {
  let sqlite: DatabaseSync;
  let db: D1Database;

  beforeEach(() => {
    sqlite = new DatabaseSync(":memory:");
    sqlite.exec(`
      CREATE TABLE orders(id TEXT PRIMARY KEY,status TEXT NOT NULL,updated_at TEXT NOT NULL);
      CREATE TABLE shipments(id TEXT PRIMARY KEY,order_id TEXT NOT NULL);
      CREATE TABLE order_status_history(id TEXT PRIMARY KEY,order_id TEXT NOT NULL,status TEXT NOT NULL,note TEXT,created_at TEXT NOT NULL);
    `);
    db = createD1(sqlite);
  });

  afterEach(() => sqlite.close());

  it("fulfills paid and processing orders exactly once", async () => {
    sqlite.exec(`
      INSERT INTO orders VALUES('paid-order','paid','old');
      INSERT INTO shipments VALUES('shipment-1','paid-order');
    `);

    await db.batch(deliveredOrderReconciliationStatements(db, "shipment-1", "2026-08-15T00:00:00.000Z"));
    await db.batch(deliveredOrderReconciliationStatements(db, "shipment-1", "2026-08-15T00:01:00.000Z"));

    expect(sqlite.prepare("SELECT status,updated_at FROM orders WHERE id='paid-order'").get()).toMatchObject({
      status: "fulfilled",
      updated_at: "2026-08-15T00:00:00.000Z",
    });
    expect(sqlite.prepare("SELECT COUNT(*) count,MAX(note) note FROM order_status_history WHERE order_id='paid-order'").get()).toMatchObject({
      count: 1,
      note: "Paket telah diterima",
    });
  });

  it("does not overwrite a cancelled order", async () => {
    sqlite.exec(`
      INSERT INTO orders VALUES('cancelled-order','cancelled','old');
      INSERT INTO shipments VALUES('shipment-2','cancelled-order');
    `);

    await db.batch(deliveredOrderReconciliationStatements(db, "shipment-2", "2026-08-15T00:00:00.000Z"));

    expect(sqlite.prepare("SELECT status,updated_at FROM orders WHERE id='cancelled-order'").get()).toMatchObject({ status: "cancelled", updated_at: "old" });
    expect(sqlite.prepare("SELECT COUNT(*) count FROM order_status_history WHERE order_id='cancelled-order'").get()).toMatchObject({ count: 0 });
  });
});
