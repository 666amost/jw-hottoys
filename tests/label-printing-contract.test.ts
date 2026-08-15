import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const orderPage = readFileSync(resolve(root, "app/pages/admin/orders.vue"), "utf8");
const printPage = readFileSync(resolve(root, "app/pages/admin/awbprint.vue"), "utf8");
const label = readFileSync(resolve(root, "app/components/ShippingLabel.vue"), "utf8");
const dataMatrixClient = readFileSync(resolve(root, "app/components/DataMatrixBarcode.client.vue"), "utf8");
const qrClient = readFileSync(resolve(root, "app/components/AwbQrCode.client.vue"), "utf8");
const labelContract = readFileSync(resolve(root, "shared/shipping-label.ts"), "utf8");
const createJob = readFileSync(resolve(root, "server/api/admin/label-print-jobs/index.post.ts"), "utf8");
const nuxtConfig = readFileSync(resolve(root, "nuxt.config.ts"), "utf8");

describe("Shopee-style label printing contract", () => {
  it("offers per-order selection, select-all, and an opaque print job URL", () => {
    expect(orderPage).toContain("Pilih semua yang dapat dicetak");
    expect(orderPage).toContain("Print label");
    expect(orderPage).toContain("Print AWB lagi");
    expect(createJob).toContain("shipment_label_print_jobs");
    expect(createJob).toContain("/admin/awbprint?job_id=");
  });

  it("renders a 100x150 expedition label and keeps first-load auto print", () => {
    expect(printPage).toContain("size: 100mm 150mm");
    expect(printPage).toContain('route.query.first_time === "1"');
    expect(label).toContain("JWLAB STUDIO");
    expect(labelContract).toContain('city: "TANGERANG"');
    expect(label).toContain("DataMatrixBarcode");
    expect(label).toContain("AwbQrCode");
    expect(label).toContain("ISI PESANAN");
  });

  it("keeps browser-only barcode libraries out of Cloudflare SSR", () => {
    expect(nuxtConfig).toContain('"/admin/awbprint": { ssr: false }');
    expect(dataMatrixClient).toContain("createDataMatrixArtwork");
    expect(qrClient).toContain('from "qrcode"');
  });
});
