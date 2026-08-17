export type PaymentState = "pending" | "paid" | "failed" | "expired" | "review";
export type PaymentStatusData = {
  id: string;
  order_number: string;
  payment_status: PaymentState;
  expires_at?: string | null;
  awb_number?: string | null;
  shipment_status?: string | null;
  shipping_provider?: "BCE" | "JNE" | null;
  shipping_service?: string | null;
};

export const QRIS_MONITORING_WINDOW_MS = 30 * 60 * 1000;
export const AWB_WAIT_WINDOW_MS = 5 * 60 * 1000;
export const PAYMENT_STATUS_FAST_POLL_WINDOW_MS = 30 * 1000;
export const PAYMENT_STATUS_FAST_POLL_INTERVAL_MS = 2 * 1000;
export const PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS = 2 * 60 * 1000;
export const PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS = 10 * 1000;
export const PAYMENT_STATUS_FALLBACK_INTERVAL_MS = 60 * 1000;

export function getPaymentMonitoringDeadline(startedAt: number, expiresAt?: string | null) {
  const maximumDeadline = startedAt + QRIS_MONITORING_WINDOW_MS;
  const gatewayDeadline = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  return Number.isFinite(gatewayDeadline) ? Math.min(maximumDeadline, gatewayDeadline) : maximumDeadline;
}

export function getNextPaymentStatusPollDelay(now: number, deadline: number, startedAt: number) {
  const remaining = deadline - now;
  if (remaining <= 0) return null;
  const elapsed = Math.max(0, now - startedAt);
  const interval = elapsed < PAYMENT_STATUS_FAST_POLL_WINDOW_MS
    ? PAYMENT_STATUS_FAST_POLL_INTERVAL_MS
    : elapsed < PAYMENT_STATUS_RELAXED_POLL_WINDOW_MS
      ? PAYMENT_STATUS_RELAXED_POLL_INTERVAL_MS
      : PAYMENT_STATUS_FALLBACK_INTERVAL_MS;
  return Math.min(interval, remaining);
}

export type PaymentMonitoringDecision = {
  shouldPoll: boolean;
  deadline: number | null;
  awbDeadline: number | null;
};

export function getPaymentMonitoringDecision(
  now: number,
  startedAt: number,
  current: PaymentStatusData,
  awbDeadline: number | null,
): PaymentMonitoringDecision {
  if (current.payment_status === "paid") {
    if (current.shipping_provider === "JNE") return { shouldPoll: false, deadline: null, awbDeadline };
    if (current.awb_number) return { shouldPoll: false, deadline: null, awbDeadline };
    const nextAwbDeadline = awbDeadline ?? now + AWB_WAIT_WINDOW_MS;
    return { shouldPoll: true, deadline: nextAwbDeadline, awbDeadline: nextAwbDeadline };
  }
  if (current.payment_status !== "pending") return { shouldPoll: false, deadline: null, awbDeadline };
  return {
    shouldPoll: true,
    deadline: getPaymentMonitoringDeadline(startedAt, current.expires_at),
    awbDeadline,
  };
}
