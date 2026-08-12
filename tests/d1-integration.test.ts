import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const schema = readFileSync(resolve(root, "database/migrations/0001_initial.sql"), "utf8");
const removeDemoCatalog = readFileSync(resolve(root, "database/migrations/0002_remove_demo_catalog.sql"), "utf8");
const fixBetterAuthDates = readFileSync(resolve(root, "database/migrations/0003_fix_better_auth_dates.sql"), "utf8");
const seed = readFileSync(resolve(root, "database/seed.sql"), "utf8");
let db: DatabaseSync;

function order(id: string) {
  db.prepare(`INSERT INTO orders(id,order_number,user_id,recipient_name,recipient_phone,shipping_address,subtotal,
    shipping_reference_amount,shipping_discount_amount,shipping_charged_amount,voucher_discount_amount,total_amount,
    expires_at,created_at,updated_at) VALUES(?,?,?,?,?,'{}',100,0,0,0,0,100,?,?,?)`)
    .run(id, `JWL-${id}`, "user-1", "Customer", "08123456789", "2099-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
}

function catalogFixture() {
  db.prepare("INSERT INTO categories(id,name,slug,sort_order,created_at) VALUES('cat-test','Robot','robot',1,'now')").run();
  db.prepare("INSERT INTO products(id,category_id,name,slug,published,featured,created_at,updated_at) VALUES('prd-test','cat-test','Test Robot','test-robot',1,0,'now','now')").run();
  db.prepare("INSERT INTO product_variants(id,product_id,sku,name,regular_price,stock_on_hand,reserved_stock,shipping_weight_grams,active,created_at,updated_at) VALUES('var-test','prd-test','TEST-ROBOT','Default',100,12,0,500,1,'now','now')").run();
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec(schema);
  db.exec(seed);
  const oldTimestamp = Date.UTC(2026, 0, 1);
  db.prepare("INSERT INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES('user-1','Customer','customer@example.test',1,?,?)").run(oldTimestamp, oldTimestamp);
  db.prepare("INSERT INTO account(id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES('account-1','user-1','credential','user-1','hash',?,?)").run(oldTimestamp, oldTimestamp);
  db.prepare("INSERT INTO session(id,expiresAt,token,createdAt,updatedAt,userId) VALUES('session-1',?,'token-1',?,?,'user-1')").run(oldTimestamp + 86_400_000, oldTimestamp, oldTimestamp);
  db.prepare("INSERT INTO admin_roles(user_id,role,created_at) VALUES('user-1','owner','2026-01-01T00:00:00.000Z')").run();
  db.prepare(`INSERT INTO addresses(id,user_id,label,recipient_name,phone,province,city,district,subdistrict,postal_code,address_line,latitude,longitude,is_default,created_at,updated_at)
    VALUES('address-1','user-1','Rumah','Customer','08123456789','DKI Jakarta','Jakarta','Test','Test','12345','Jalan Test',-6.2,106.8,1,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z')`).run();
  db.prepare(`INSERT INTO orders(id,order_number,user_id,address_id,recipient_name,recipient_phone,shipping_address,subtotal,
    shipping_reference_amount,shipping_discount_amount,shipping_charged_amount,voucher_discount_amount,total_amount,
    expires_at,created_at,updated_at) VALUES('migration-order','JWL-MIGRATION','user-1','address-1','Customer','08123456789','{}',100,0,0,0,0,100,'2099','2026','2026')`).run();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(fixBetterAuthDates);
    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
});
afterEach(() => db.close());

describe("D1 transactional invariants", () => {
  it("stores Better Auth dates as ISO text and preserves auth/address ownership", () => {
    const sessionColumns = db.prepare("PRAGMA table_info(session)").all() as Array<{ name: string; type: string }>;
    expect(sessionColumns.find(column => column.name === "expiresAt")?.type).toBe("TEXT");
    expect(db.prepare("SELECT typeof(expiresAt) type, expiresAt FROM session WHERE id='session-1'").get()).toMatchObject({
      type: "text",
      expiresAt: "2026-01-02T00:00:00.000Z",
    });
    expect(db.prepare("SELECT role FROM admin_roles WHERE user_id='user-1'").get()).toMatchObject({ role: "owner" });
    expect(db.prepare("SELECT address_id FROM orders WHERE id='migration-order'").get()).toMatchObject({ address_id: "address-1" });
    expect(() => db.prepare(`INSERT INTO session(id,expiresAt,token,createdAt,updatedAt,userId)
      VALUES('session-iso','2026-02-01T00:00:00.000Z','token-iso','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z','user-1')`).run()).not.toThrow();
  });

  it("prevents overselling and releases or consumes a reservation exactly once", () => {
    catalogFixture();
    order("order-1");
    order("order-2");
    db.prepare("INSERT INTO stock_reservations(id,order_id,variant_id,quantity,status,expires_at,created_at,updated_at) VALUES('res-1','order-1','var-test',10,'active','2099','now','now')").run();
    expect(db.prepare("SELECT reserved_stock value FROM product_variants WHERE id='var-test'").get()).toMatchObject({ value: 10 });
    expect(() => db.prepare("INSERT INTO stock_reservations(id,order_id,variant_id,quantity,status,expires_at,created_at,updated_at) VALUES('res-2','order-2','var-test',3,'active','2099','now','now')").run()).toThrow(/INSUFFICIENT_STOCK/);
    db.prepare("UPDATE stock_reservations SET status='consumed',updated_at='later' WHERE id='res-1' AND status='active'").run();
    db.prepare("UPDATE stock_reservations SET status='consumed',updated_at='again' WHERE id='res-1' AND status='active'").run();
    expect(db.prepare("SELECT stock_on_hand stock,reserved_stock reserved FROM product_variants WHERE id='var-test'").get()).toMatchObject({ stock: 2, reserved: 0 });
  });

  it("deduplicates payment events and outbox work", () => {
    db.prepare("INSERT OR IGNORE INTO payment_events(id,provider,event_id,order_number,event_type,payload,processed_at) VALUES('event-1','sumopod','external-1','JWL-1','paid','{}','now')").run();
    db.prepare("INSERT OR IGNORE INTO payment_events(id,provider,event_id,order_number,event_type,payload,processed_at) VALUES('event-2','sumopod','external-1','JWL-1','paid','{}','now')").run();
    db.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES('job-1','shipment_creation','order-1','{}','pending','now','now','now')").run();
    db.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES('job-2','shipment_creation','order-1','{}','pending','now','now','now')").run();
    expect(db.prepare("SELECT COUNT(*) count FROM payment_events").get()).toMatchObject({ count: 1 });
    expect(db.prepare("SELECT COUNT(*) count FROM outbox_jobs").get()).toMatchObject({ count: 1 });
  });

  it("enforces voucher capacity across active orders", () => {
    order("order-1");
    order("order-2");
    db.prepare("INSERT INTO vouchers(id,code,kind,value,usage_limit,active,created_at) VALUES('voucher-1','ONCE','fixed',100,1,1,'now')").run();
    db.prepare("INSERT INTO voucher_reservations(id,voucher_id,user_id,order_id,status,expires_at,created_at) VALUES('vr-1','voucher-1','user-1','order-1','active','2099','now')").run();
    expect(() => db.prepare("INSERT INTO voucher_reservations(id,voucher_id,user_id,order_id,status,expires_at,created_at) VALUES('vr-2','voucher-1','user-1','order-2','active','2099','now')").run()).toThrow(/VOUCHER_UNAVAILABLE/);
  });

  it("starts with an empty catalog and keeps the two announcements idempotently", () => {
    db.exec(seed);
    expect(db.prepare("SELECT COUNT(*) count FROM categories").get()).toMatchObject({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) count FROM products").get()).toMatchObject({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) count FROM site_announcements").get()).toMatchObject({ count: 2 });
  });

  it("removes only demo products and preserves operator catalog data", () => {
    db.prepare("INSERT INTO categories(id,name,slug,sort_order,created_at) VALUES('cat-figure','Figure','figure',1,'now')").run();
    db.prepare("INSERT INTO products(id,category_id,name,slug,published,featured,created_at,updated_at) VALUES('prd-arka-bima','cat-figure','Demo','demo',1,0,'now','now')").run();
    db.prepare("INSERT INTO products(id,category_id,name,slug,published,featured,created_at,updated_at) VALUES('prd-real','cat-figure','Real Robot','real-robot',1,0,'now','now')").run();
    db.exec(removeDemoCatalog);
    db.exec(removeDemoCatalog);
    expect(db.prepare("SELECT COUNT(*) count FROM products WHERE id='prd-arka-bima'").get()).toMatchObject({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) count FROM products WHERE id='prd-real'").get()).toMatchObject({ count: 1 });
    expect(db.prepare("SELECT COUNT(*) count FROM categories WHERE id='cat-figure'").get()).toMatchObject({ count: 1 });
  });
});
