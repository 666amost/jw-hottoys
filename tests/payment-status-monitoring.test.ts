import { describe, expect, it } from "vitest";
import {
  AWB_WAIT_WINDOW_MS,
  getPaymentMonitoringDecision,
  type PaymentStatusData,
} from "../shared/payment-status-monitoring";

const baseStatus: PaymentStatusData = {
  id: "order-id",
  order_number: "JWL-1",
  payment_status: "pending",
  expires_at: "2026-08-15T10:30:00.000Z",
  awb_number: null,
};

describe("payment status monitoring", () => {
  it("switches to a five-minute AWB deadline after payment is paid", () => {
    const now = Date.parse("2026-08-15T10:29:59.000Z");
    const decision = getPaymentMonitoringDecision(now, now - 60_000, {
      ...baseStatus,
      payment_status: "paid",
      expires_at: "2026-08-15T10:00:00.000Z",
    }, null);

    expect(decision).toEqual({
      shouldPoll: true,
      deadline: now + AWB_WAIT_WINDOW_MS,
      awbDeadline: now + AWB_WAIT_WINDOW_MS,
    });
  });

  it("keeps the original AWB deadline during subsequent paid polls", () => {
    const deadline = Date.parse("2026-08-15T10:35:00.000Z");
    const decision = getPaymentMonitoringDecision(deadline - 30_000, deadline - 5 * 60_000, {
      ...baseStatus,
      payment_status: "paid",
    }, deadline);

    expect(decision.deadline).toBe(deadline);
    expect(decision.awbDeadline).toBe(deadline);
    expect(decision.shouldPoll).toBe(true);
  });

  it("does not poll for a manually fulfilled JNE AWB", () => {
    expect(getPaymentMonitoringDecision(1_000, 0, { ...baseStatus, payment_status: "paid", shipping_provider: "JNE" }, null)).toEqual({
      shouldPoll: false,
      deadline: null,
      awbDeadline: null,
    });
  });

  it("stops polling as soon as an AWB is available", () => {
    const decision = getPaymentMonitoringDecision(Date.now(), Date.now(), {
      ...baseStatus,
      payment_status: "paid",
      awb_number: "BCE123",
    }, null);

    expect(decision.shouldPoll).toBe(false);
    expect(decision.deadline).toBeNull();
  });

  it("stops polling for a non-paid terminal payment", () => {
    const decision = getPaymentMonitoringDecision(Date.now(), Date.now(), {
      ...baseStatus,
      payment_status: "failed",
    }, null);

    expect(decision.shouldPoll).toBe(false);
  });
});
