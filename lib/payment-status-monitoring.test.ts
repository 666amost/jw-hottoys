import { describe, expect, it } from "vitest";
import {
  getNextPaymentStatusPollDelay,
  getPaymentMonitoringDeadline,
  PAYMENT_STATUS_FAST_POLL_INTERVAL_MS,
  PAYMENT_STATUS_FAST_POLL_WINDOW_MS,
  PAYMENT_STATUS_FALLBACK_INTERVAL_MS,
  PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS,
  PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS,
  QRIS_MONITORING_WINDOW_MS,
} from "./payment-status-monitoring";

describe("payment status monitoring", () => {
  it("limits automatic monitoring to 30 minutes", () => {
    expect(getPaymentMonitoringDeadline(1_000)).toBe(1_000 + QRIS_MONITORING_WINDOW_MS);
  });

  it("uses an earlier gateway expiry when supplied", () => {
    const startedAt = Date.parse("2026-08-04T00:00:00.000Z");
    const expiresAt = "2026-08-04T00:15:00.000Z";
    expect(getPaymentMonitoringDeadline(startedAt, expiresAt)).toBe(Date.parse(expiresAt));
  });

  it("polls quickly while the payment webhook is most likely still arriving", () => {
    expect(getNextPaymentStatusPollDelay(0, QRIS_MONITORING_WINDOW_MS, 0)).toBe(
      PAYMENT_STATUS_FAST_POLL_INTERVAL_MS,
    );
    expect(
      getNextPaymentStatusPollDelay(
        PAYMENT_STATUS_FAST_POLL_WINDOW_MS,
        QRIS_MONITORING_WINDOW_MS,
        0,
      ),
    ).toBe(PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS);
    expect(
      getNextPaymentStatusPollDelay(
        PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS,
        QRIS_MONITORING_WINDOW_MS,
        0,
      ),
    ).toBe(PAYMENT_STATUS_FALLBACK_INTERVAL_MS);
  });

  it("stops at the deadline and never schedules past it", () => {
    expect(getNextPaymentStatusPollDelay(29_000, 30_000, 0)).toBe(1_000);
    expect(
      getNextPaymentStatusPollDelay(
        QRIS_MONITORING_WINDOW_MS,
        QRIS_MONITORING_WINDOW_MS,
        0,
      ),
    ).toBeNull();
  });
});
