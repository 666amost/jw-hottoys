import { z } from "zod";

const eventSchema = z.object({
  event_type: z.enum(["payment.completed", "payment.failed", "payment.expired", "payment.test"]),
  data: z.object({ payment_id: z.string().optional().default(""), order_id: z.string().optional().default(""), amount: z.coerce.number().int().nonnegative().optional().default(0), currency: z.string().optional().default("IDR"), completed_at: z.string().optional() }).passthrough(),
});

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default defineEventHandler(async (event) => {
  const length = Number(getHeader(event, "content-length") || 0);
  if (length > 1024 * 1024) apiError(413, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  const raw = await readRawBody(event) || "";
  if (raw.length > 1024 * 1024) apiError(413, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  let verified: unknown;
  try { verified = verifySumoPodWebhook(appConfig(event), raw, event.headers); }
  catch { apiError(401, "INVALID_SIGNATURE", "Webhook signature tidak valid."); }
  const parsed = eventSchema.safeParse(verified);
  if (!parsed.success) apiError(422, "INVALID_EVENT", "Payload webhook tidak valid.");
  if (parsed.data.event_type === "payment.test") return { received: true };
  const env = bindings(event);
  const db = env.DB;
  const eventId = getHeader(event, "svix-id") || getHeader(event, "x-webhook-id") || `sha256:${await sha256(raw)}`;
  const inserted = await db.prepare("INSERT OR IGNORE INTO payment_events(id,provider,event_id,order_number,event_type,payload,processed_at) VALUES(?,?,?,?,?,?,datetime('now'))")
    .bind(crypto.randomUUID(), "sumopod", eventId, parsed.data.data.order_id, parsed.data.event_type, JSON.stringify(verified)).run();
  if (!inserted.meta.changes) return { received: true, transaction: { result: "duplicate" } };
  const order = await db.prepare(`SELECT o.id,o.user_id,o.payment_status,o.expires_at,o.voucher_id,o.voucher_discount_amount,p.external_payment_id,p.amount,p.currency,q.provider,q.service_name
    FROM orders o JOIN payments p ON p.order_id=o.id JOIN shipping_quotes q ON q.order_id=o.id WHERE o.order_number=?`).bind(parsed.data.data.order_id).first<{
      id: string; user_id: string; payment_status: string; expires_at: string; voucher_id: string | null; voucher_discount_amount: number;
      external_payment_id: string | null; amount: number; currency: string; provider: "BCE" | "JNE"; service_name: string;
    }>();
  if (!order) apiError(404, "ORDER_NOT_FOUND", "Order webhook tidak ditemukan.");
  const now = new Date();
  const nowIso = now.toISOString();
  const payload = parsed.data.data;
  const completedAtMs = payload.completed_at ? Math.min(Date.parse(payload.completed_at), now.getTime()) : now.getTime();
  const mismatch = order.external_payment_id !== payload.payment_id || order.amount !== payload.amount || order.currency !== payload.currency;
  if (parsed.data.event_type === "payment.completed" && !mismatch && completedAtMs <= Date.parse(order.expires_at) && order.payment_status === "pending") {
    const outboxId = crypto.randomUUID();
    const statements: D1PreparedStatement[] = [
      db.prepare("UPDATE payments SET status='paid',updated_at=? WHERE order_id=? AND status='pending'").bind(nowIso, order.id),
      db.prepare("UPDATE orders SET status='paid',payment_status='paid',paid_at=?,updated_at=? WHERE id=? AND payment_status='pending'").bind(nowIso, nowIso, order.id),
      db.prepare("UPDATE stock_reservations SET status='consumed',updated_at=? WHERE order_id=? AND status='active'").bind(nowIso, order.id),
      db.prepare("UPDATE voucher_reservations SET status='consumed' WHERE order_id=? AND status='active'").bind(order.id),
      db.prepare("INSERT OR IGNORE INTO shipments(id,order_id,provider,status,created_at,updated_at) VALUES(?,?,?,'pending_awb',?,?)").bind(crypto.randomUUID(), order.id, order.provider, nowIso, nowIso),
      db.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,'paid','Pembayaran QRIS terverifikasi',?)").bind(crypto.randomUUID(), order.id, nowIso),
    ];
    if (order.provider === "BCE") statements.push(
      db.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES(?,'shipment_creation',?,?, 'pending',?,?,?)")
        .bind(outboxId, order.id, JSON.stringify({ orderId: order.id }), nowIso, nowIso, nowIso),
    );
    if (order.voucher_id) {
      statements.push(
        db.prepare("UPDATE vouchers SET used_count=used_count+1 WHERE id=? AND NOT EXISTS(SELECT 1 FROM voucher_redemptions WHERE order_id=?)").bind(order.voucher_id, order.id),
        db.prepare("INSERT OR IGNORE INTO voucher_redemptions(id,voucher_id,user_id,order_id,discount_amount,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(), order.voucher_id, order.user_id, order.id, order.voucher_discount_amount, nowIso),
      );
    }
    await db.batch(statements);
    if (order.provider === "BCE") try { await dispatchOutbox(env, outboxId); } catch { /* cron retries the outbox */ }
    return { received: true, transaction: { result: "paid", order_id: order.id } };
  }
  if (parsed.data.event_type === "payment.completed") {
    await db.batch([
      db.prepare("UPDATE payments SET status='review',updated_at=? WHERE order_id=? AND status<>'paid'").bind(nowIso, order.id),
      db.prepare("UPDATE orders SET payment_status='review',updated_at=? WHERE id=? AND payment_status<>'paid'").bind(nowIso, order.id),
    ]);
    return { received: true, transaction: { result: "review", reason: mismatch ? "payment_mismatch" : "late_payment" } };
  }
  if (order.payment_status === "pending") await cancelCheckout(db, order.id, parsed.data.event_type);
  return { received: true, transaction: { result: "released", order_id: order.id } };
});
