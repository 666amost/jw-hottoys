export default defineEventHandler(async (event) => {
  assertSafeMutation(event); await requireAdmin(event); const env = bindings(event); const orderId = getRouterParam(event,"orderId"); const now = new Date().toISOString(); const outboxId = crypto.randomUUID();
  const result = await env.DB.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES(?,'shipment_creation',?,?,'pending',?,?,?)")
    .bind(outboxId, `${orderId}:retry:${Date.now()}`, JSON.stringify({ orderId }), now, now, now).run(); if (!result.meta.changes) apiError(409,"RETRY_EXISTS","Retry sudah dijadwalkan.");
  try { await dispatchOutbox(env,outboxId); } catch { /* cron retries */ } return { queued:true };
});
