export const QRIS_MONITORING_WINDOW_MS = 30 * 60 * 1000;
export const PAYMENT_STATUS_FALLBACK_INTERVAL_MS = 60 * 1000;

export function getPaymentMonitoringDeadline(startedAt: number, expiresAt?: string | null) {
  const maximumDeadline = startedAt + QRIS_MONITORING_WINDOW_MS;
  if (!expiresAt) return maximumDeadline;

  const gatewayDeadline = Date.parse(expiresAt);
  return Number.isFinite(gatewayDeadline)
    ? Math.min(maximumDeadline, gatewayDeadline)
    : maximumDeadline;
}

export function getNextPaymentStatusPollDelay(now: number, deadline: number) {
  const remaining = deadline - now;
  if (remaining <= 0) return null;
  return Math.min(PAYMENT_STATUS_FALLBACK_INTERVAL_MS, remaining);
}
