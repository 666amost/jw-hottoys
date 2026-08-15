import { describe, expect, it } from "vitest";
import { createDataMatrixArtwork } from "../app/lib/data-matrix";
import { getFulfillmentBucket } from "../shared/order-fulfillment-bucket";
import {
  normalizeAwbForBarcode,
  paginateLabelItemsByHeight,
  SHIPPING_LABEL_SENDER,
  shippingLabelItemText,
  type ShippingLabelItem,
} from "../shared/shipping-label";

const printable = {
  paymentStatus: "paid",
  orderStatus: "paid",
  shipmentStatus: "awb_created",
  awbNumber: "BCE001",
};

describe("admin fulfillment buckets", () => {
  it("separates unprinted and printed active AWBs", () => {
    expect(getFulfillmentBucket({ ...printable, labelPrintedAt: null })).toBe("needs_processing");
    expect(getFulfillmentBucket({ ...printable, labelPrintedAt: "2026-08-15T00:00:00.000Z" })).toBe("processed");
  });

  it.each([
    { ...printable, paymentStatus: "pending" },
    { ...printable, awbNumber: null },
    { ...printable, orderStatus: "fulfilled" },
    { ...printable, orderStatus: "cancelled" },
    { ...printable, shipmentStatus: "delivered" },
  ])("excludes orders outside the active fulfillment queue", (input) => {
    expect(getFulfillmentBucket(input)).toBeNull();
  });
});

describe("shipping label helpers", () => {
  const items: ShippingLabelItem[] = Array.from({ length: 4 }, (_, index) => ({
    product_name: `Robot ${index + 1}`,
    variant_name: "Standard",
    sku: `SKU-${index + 1}`,
    quantity: index + 1,
  }));

  it("keeps the fixed JWLAB Tangerang sender and one normalized AWB value", () => {
    expect(SHIPPING_LABEL_SENDER).toEqual({ name: "JWLAB STUDIO", city: "TANGERANG" });
    expect(normalizeAwbForBarcode(" bce-001-jwl ")).toBe("BCE001JWL");
    expect(shippingLabelItemText(items[0]!)).toBe("1× SKU-1 — Robot 1 / Standard");
  });

  it("builds crisp Data Matrix artwork from the same normalized AWB", () => {
    const artwork = createDataMatrixArtwork("bce-001-jwl");
    expect(artwork?.normalizedValue).toBe("BCE001JWL");
    expect(artwork?.path.length).toBeGreaterThan(100);
    expect(artwork?.symbolWidth).toBeGreaterThan(0);
    expect(artwork?.symbolHeight).toBeGreaterThan(0);
  });

  it("continues item rows onto additional thermal pages without dropping data", () => {
    const pages = paginateLabelItemsByHeight(items, [60, 60, 60, 60], 120, 100);
    expect(pages.map(page => page.length)).toEqual([2, 1, 1]);
    expect(pages.flat()).toEqual(items);
  });
});
