import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isBceCityCode } from "../shared/address-regions";
import { isSupportedDestination } from "../shared/shipping";

const root = resolve(import.meta.dirname, "..");
const quoteRoute = readFileSync(resolve(root, "server/api/shipping/quotes.post.ts"), "utf8");
const checkout = readFileSync(resolve(root, "server/utils/commerce.ts"), "utf8");
const paymentWebhook = readFileSync(resolve(root, "server/api/webhooks/sumopod.post.ts"), "utf8");
const operations = readFileSync(resolve(root, "workers/operations.ts"), "utf8");
const migration = readFileSync(resolve(root, "database/migrations/0005_multi_carrier_shipping.sql"), "utf8");

describe("multi-carrier shipping contract", () => {
  it("routes only the seven existing cities to BCE", () => {
    expect(isBceCityCode("3171")).toBe(true);
    expect(isBceCityCode("3674")).toBe(true);
    expect(isBceCityCode("3603")).toBe(false);
    expect(isBceCityCode("3275")).toBe(false);
    expect(isSupportedDestination("Kabupaten Tangerang", "3603")).toBe(false);
  });

  it("persists a reusable server-side quote and never recalculates during checkout", () => {
    expect(migration).toContain("CREATE TABLE checkout_shipping_quotes");
    expect(quoteRoute).toContain("calculateJneCosts");
    expect(migration).toContain("checkout_shipping_quotes_lookup_idx");
    expect(checkout).toContain("shippingQuoteId");
    expect(checkout).not.toContain("calculateJneCosts");
  });

  it("queues automatic fulfillment for BCE only", () => {
    expect(paymentWebhook).toContain('order.provider === "BCE"');
    expect(operations).toContain("provider='BCE'");
  });
});
