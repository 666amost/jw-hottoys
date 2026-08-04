export function normalizeSumoPodCompletedAt(
  completedAt: string | undefined,
  receivedAt = new Date(),
) {
  const parsed = completedAt ? Date.parse(completedAt) : Number.NaN;
  if (!Number.isFinite(parsed)) return receivedAt.toISOString();

  // Sandbox currently reports its future settlement estimate as completed_at.
  // A payment cannot complete after the webhook that reports its completion.
  return new Date(Math.min(parsed, receivedAt.getTime())).toISOString();
}
