export type PaymentState = "pending" | "paid" | "failed" | "expired" | "review";

export type PaymentStatusData = {
  id: string;
  order_number: string;
  payment_status: PaymentState;
  payments?: { expires_at: string | null } | Array<{ expires_at: string | null }>;
  shipments?: Array<{ awb_number: string | null; status: string }>;
};

export const QRIS_MONITORING_WINDOW_MS = 30 * 60 * 1000;
export const PAYMENT_STATUS_FAST_POLL_WINDOW_MS = 30 * 1000;
export const PAYMENT_STATUS_FAST_POLL_INTERVAL_MS = 2 * 1000;
export const PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS = 2 * 60 * 1000;
export const PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS = 10 * 1000;
export const PAYMENT_STATUS_FALLBACK_INTERVAL_MS = 60 * 1000;

export function getPaymentMonitoringDeadline(startedAt: number, expiresAt?: string | null) {
  const maximumDeadline = startedAt + QRIS_MONITORING_WINDOW_MS;
  if (!expiresAt) return maximumDeadline;

  const gatewayDeadline = Date.parse(expiresAt);
  return Number.isFinite(gatewayDeadline)
    ? Math.min(maximumDeadline, gatewayDeadline)
    : maximumDeadline;
}

export function getNextPaymentStatusPollDelay(
  now: number,
  deadline: number,
  startedAt: number,
) {
  const remaining = deadline - now;
  if (remaining <= 0) return null;

  const elapsed = Math.max(0, now - startedAt);
  const interval =
    elapsed < PAYMENT_STATUS_FAST_POLL_WINDOW_MS
      ? PAYMENT_STATUS_FAST_POLL_INTERVAL_MS
      : elapsed < PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS
        ? PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS
        : PAYMENT_STATUS_FALLBACK_INTERVAL_MS;

  return Math.min(interval, remaining);
}
