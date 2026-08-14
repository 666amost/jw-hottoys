import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const webConfig = readFileSync(resolve(root, "wrangler.web.jsonc"), "utf8");
const operationsConfig = readFileSync(resolve(root, "wrangler.operations.jsonc"), "utf8");
const nuxtConfig = readFileSync(resolve(root, "nuxt.config.ts"), "utf8");
const adminIntegration = readFileSync(resolve(root, "server/api/admin/integrations.get.ts"), "utf8");
const operations = readFileSync(resolve(root, "workers/operations.ts"), "utf8");
const retryEndpoint = readFileSync(resolve(root, "server/api/admin/shipments/[orderId]/retry.post.ts"), "utf8");

describe("BCE deployment contract", () => {
  it("configures the BCE API in both workers and the public tracking URL in the web worker", () => {
    expect(webConfig).toContain('"BCE_API_URL": "https://www.bcexp.id"');
    expect(webConfig).toContain('"NUXT_PUBLIC_BCE_TRACKING_URL": "https://www.bcexp.id/track"');
    expect(operationsConfig).toContain('"BCE_API_URL": "https://www.bcexp.id"');
    expect(nuxtConfig).toContain('bceTrackingUrl: "https://bcexp.id/track"');
  });

  it("does not require the optional BCE webhook for the admin configuration indicator", () => {
    expect(adminIntegration).toContain("bce: Boolean(config.bceApiUrl && config.bcePartnerKey)");
    expect(adminIntegration).not.toContain("config.bceWebhookSecret)");
  });

  it("keeps permanent queue failures out of the scheduled outbox drain", () => {
    expect(operations).toContain("WHERE status='pending'");
    expect(operations).toContain("error_message IS NULL");
    expect(operations).toContain("error instanceof BceHttpError && !error.retryable");
    expect(operations).not.toContain("status IN ('pending','failed')");
  });

  it("routes manual retries to shipment creation or tracking based on AWB availability", () => {
    expect(retryEndpoint).toContain('shipment.awb_number ? "tracking_reconciliation" : "shipment_creation"');
    expect(retryEndpoint).toContain("{ shipmentId: shipment.id }");
    expect(retryEndpoint).toContain("{ orderId }");
  });
});
