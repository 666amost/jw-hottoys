export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  await requireAdmin(event);
  const env = bindings(event);
  const orderId = getRouterParam(event, "orderId");
  const shipment = await env.DB.prepare("SELECT id,awb_number FROM shipments WHERE order_id=? AND provider='BCE'")
    .bind(orderId)
    .first<{ id: string; awb_number: string | null }>();
  if (!shipment) apiError(404, "SHIPMENT_NOT_FOUND", "Shipment tidak ditemukan.");

  const now = new Date().toISOString();
  const outboxId = crypto.randomUUID();
  const kind = shipment.awb_number ? "tracking_reconciliation" : "shipment_creation";
  const payload = shipment.awb_number ? { shipmentId: shipment.id } : { orderId };
  const result = await env.DB.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES(?,?,?,?, 'pending',?,?,?)")
    .bind(outboxId, kind, `${orderId}:${kind}:retry:${Date.now()}`, JSON.stringify(payload), now, now, now).run();
  if (!result.meta.changes) apiError(409, "RETRY_EXISTS", "Retry sudah dijadwalkan.");

  try {
    await dispatchOutbox(env, outboxId);
  } catch { /* cron retries pending queue dispatches */ }
  return { queued: true, kind };
});
