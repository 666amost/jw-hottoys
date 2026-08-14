import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const migration = readFileSync(resolve(root, "database/migrations/0001_initial.sql"), "utf8");
const payment = readFileSync(resolve(root, "server/utils/integrations.ts"), "utf8");
const webhook = readFileSync(resolve(root, "server/api/webhooks/sumopod.post.ts"), "utf8");
const bceWebhook = readFileSync(resolve(root, "server/api/webhooks/bce.post.ts"), "utf8");
const operations = readFileSync(resolve(root, "workers/operations.ts"), "utf8");
const checkout = readFileSync(resolve(root, "server/utils/commerce.ts"), "utf8");

describe("D1 payment and stock contract", () => {
  it("enforces idempotency and atomic reservation guards", () => {
    expect(migration).toContain("UNIQUE(provider, event_id)");
    expect(migration).toContain("UNIQUE(order_id, variant_id)");
    expect(migration).toContain("UNIQUE(kind, dedupe_key)");
    expect(migration).toContain("RAISE(ABORT, 'INSUFFICIENT_STOCK')");
    expect(migration).toContain("RAISE(ABORT, 'VOUCHER_UNAVAILABLE')");
  });

  it("consumes stock once and publishes shipment through an outbox", () => {
    expect(migration).toContain("OLD.status = 'active' AND NEW.status = 'consumed'");
    expect(migration).toContain("stock_on_hand = stock_on_hand - NEW.quantity");
    expect(webhook).toContain("INSERT OR IGNORE INTO outbox_jobs");
    expect(webhook).toContain("dispatchOutbox(env, outboxId)");
    expect(operations).toContain("outboxId");
    expect(operations).toContain("message.ack()");
  });

  it("sends the server-calculated total to SumoPod QRIS", () => {
    expect(payment).toContain("amount: input.amount");
    expect(payment).toContain('payment_method_type_code: "QRIS"');
    expect(payment).toContain("expires_in_hours: QRIS_EXPIRY_HOURS");
    expect(payment).toContain("getSumoPodReturnUrls(config.siteUrl, input.orderNumber)");
    expect(checkout).toContain("30 * 60 * 1000");
    expect(payment).not.toContain("shipping_reference_amount");
  });

  it("keeps BCE processing monotonic and idempotent", () => {
    expect(migration).toContain("UNIQUE(shipment_id, external_event_id)");
    expect(operations).toContain("const statusRank");
    expect(operations).toContain('"Idempotency-Key"');
    expect(operations).toContain("mapBceTrackingStatus");
    expect(operations).toContain("status shipment dipertahankan");
    expect(operations).not.toContain('|| mapped === "exception"');
    expect(operations).not.toContain('|| mappedOverall === "exception"');
    expect(bceWebhook).not.toContain('|| parsed.data.status === "exception"');
    expect(operations).toContain("deliveredOrderReconciliationStatements");
    expect(bceWebhook).toContain("deliveredOrderReconciliationStatements");
  });
});
