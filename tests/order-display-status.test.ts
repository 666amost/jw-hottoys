import { describe, expect, it } from "vitest";
import { canRetryBceShipment, getOrderDisplayStatus, shipmentStatusLabel } from "../shared/order-display-status";

describe("order display status", () => {
  it("uses one shipment-aware status instead of repeating paid", () => {
    expect(getOrderDisplayStatus({ orderStatus: "paid", paymentStatus: "paid", shipmentStatus: "awb_created" })).toMatchObject({
      key: "awb_created",
      label: "Resi dibuat",
    });
    expect(getOrderDisplayStatus({ orderStatus: "fulfilled", paymentStatus: "paid", shipmentStatus: "delivered" })).toMatchObject({
      key: "fulfilled",
      label: "Selesai",
      detail: "Paket diterima",
    });
  });

  it("keeps cancelled and payment problems ahead of shipping progress", () => {
    expect(getOrderDisplayStatus({ orderStatus: "cancelled", paymentStatus: "paid", shipmentStatus: "delivered" }).key).toBe("cancelled");
    expect(getOrderDisplayStatus({ orderStatus: "awaiting_payment", paymentStatus: "review", shipmentStatus: null }).key).toBe("payment_review");
  });

  it("localizes shipment events", () => {
    expect(shipmentStatusLabel("awb_created")).toBe("Resi dibuat");
    expect(shipmentStatusLabel("in_transit")).toBe("Dalam perjalanan");
    expect(shipmentStatusLabel("delivered")).toBe("Paket diterima");
  });

  it("offers BCE retry only for a failed paid shipment without an AWB", () => {
    expect(canRetryBceShipment({ paymentStatus: "paid", awbNumber: null, shipmentError: "BCE timeout" })).toBe(true);
    expect(canRetryBceShipment({ paymentStatus: "paid", awbNumber: "BCE123", shipmentError: "Tracking timeout" })).toBe(false);
    expect(canRetryBceShipment({ paymentStatus: "paid", awbNumber: null, shipmentError: null })).toBe(false);
    expect(canRetryBceShipment({ paymentStatus: "pending", awbNumber: null, shipmentError: "BCE timeout" })).toBe(false);
  });
});
