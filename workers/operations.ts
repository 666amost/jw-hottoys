import { isPermanentBceHttpStatus, mapBceTrackingStatus } from "../shared/bce-integration";
import { deliveredOrderReconciliationStatements } from "../shared/order-fulfillment";

interface OperationsEnv extends CloudflareBindings {
  DB: D1Database;
  SHIPMENT_QUEUE: Queue;
  TRACKING_QUEUE: Queue;
  BCE_API_URL?: string;
  BCE_PARTNER_KEY?: string;
}

type QueueBody = { outboxId: string; orderId?: string; shipmentId?: string };
const statusRank: Record<string, number> = { pending_awb: 0, awb_created: 1, picked_up: 2, in_transit: 3, delivered: 4, exception: 3 };
const rank = (status: string) => statusRank[status] ?? -1;

class BceHttpError extends Error {
  readonly retryable: boolean;

  constructor(operation: string, readonly status: number) {
    super(`BCE ${operation} gagal (${status}).`);
    this.name = "BceHttpError";
    this.retryable = !isPermanentBceHttpStatus(status);
  }
}

async function bceFetch(env: OperationsEnv, path: string, init: RequestInit) {
  if (!env.BCE_API_URL || !env.BCE_PARTNER_KEY) throw new Error("BCE belum dikonfigurasi.");
  return fetch(`${env.BCE_API_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.BCE_PARTNER_KEY}`, ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
}

async function processShipment(env: OperationsEnv, body: QueueBody) {
  if (!body.orderId) throw new Error("Queue shipment tidak memiliki orderId.");
  const order = await env.DB.prepare(`SELECT o.id,o.order_number,o.recipient_name,o.recipient_phone,o.shipping_address,o.shipping_charged_amount,
    q.billable_weight_kg,q.total_weight_grams,s.id shipment_id,s.awb_number
    FROM orders o JOIN shipping_quotes q ON q.order_id=o.id LEFT JOIN shipments s ON s.order_id=o.id
    WHERE o.id=? AND o.payment_status='paid'`).bind(body.orderId).first<{
      id: string; order_number: string; recipient_name: string; recipient_phone: string; shipping_address: string;
      shipping_charged_amount: number; billable_weight_kg: number; total_weight_grams: number; shipment_id: string | null; awb_number: string | null;
    }>();
  if (!order) throw new Error("Order paid tidak ditemukan.");
  if (order.awb_number) return order.awb_number;
  const { results: items } = await env.DB.prepare("SELECT product_name,quantity FROM order_items WHERE order_id=?").bind(order.id).all<{ product_name: string; quantity: number }>();
  const address = JSON.parse(order.shipping_address) as Record<string, unknown>;
  const response = await bceFetch(env, "/api/v1/partner/shipments", {
    method: "POST",
    headers: { "Idempotency-Key": order.id },
    body: JSON.stringify({
      external_order_id: order.order_number,
      sender: { warehouse_code: "JWLAB-STUDIO-JKT" },
      recipient: {
        name: order.recipient_name, phone: order.recipient_phone, address_line: address.address_line,
        province: address.province, city: address.city, district: address.district, subdistrict: address.subdistrict,
        postal_code: address.postal_code, landmark: address.landmark, latitude: address.latitude, longitude: address.longitude,
      },
      actual_weight_grams: order.total_weight_grams,
      billable_weight_kg: order.billable_weight_kg,
      content_description: items.map((item) => `${item.product_name} x${item.quantity}`).join(", "),
      package_count: 1,
      shipping_charged_amount: order.shipping_charged_amount,
    }),
  });
  const raw = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new BceHttpError("pembuatan shipment", response.status);
  if (!raw) throw new Error("BCE tidak mengembalikan respons shipment yang valid.");
  const value = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const awb = String(value.awb_number || value.awb || "");
  if (!awb) throw new Error("BCE tidak mengembalikan AWB.");
  const now = new Date().toISOString();
  const shipmentId = order.shipment_id || crypto.randomUUID();
  const outboxId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO shipments(id,order_id,provider,status,created_at,updated_at) VALUES(?,?,'BCE','pending_awb',?,?)").bind(shipmentId, order.id, now, now),
    env.DB.prepare("UPDATE shipments SET awb_number=?,status='awb_created',error_message=NULL,retry_count=0,next_tracking_at=?,updated_at=? WHERE order_id=? AND awb_number IS NULL")
      .bind(awb, new Date(Date.now() + 5 * 60_000).toISOString(), now, order.id),
    env.DB.prepare("INSERT OR IGNORE INTO shipment_events(id,shipment_id,external_event_id,status,location,note,occurred_at) VALUES(?,?,?,'awb_created','Jakarta','Resi BCE Express berhasil dibuat',?)")
      .bind(crypto.randomUUID(), shipmentId, `created:${awb}`, now),
    env.DB.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES(?,'tracking_reconciliation',?,?,'pending',?,?,?)")
      .bind(outboxId, `${shipmentId}:initial`, JSON.stringify({ shipmentId }), new Date(Date.now() + 5 * 60_000).toISOString(), now, now),
    env.DB.prepare("UPDATE outbox_jobs SET status='completed',updated_at=? WHERE id=?").bind(now, body.outboxId),
  ]);
  return awb;
}

async function processTracking(env: OperationsEnv, body: QueueBody) {
  if (!body.shipmentId) throw new Error("Queue tracking tidak memiliki shipmentId.");
  const shipment = await env.DB.prepare("SELECT id,awb_number,status FROM shipments WHERE id=?").bind(body.shipmentId).first<{ id: string; awb_number: string | null; status: string }>();
  if (!shipment?.awb_number) throw new Error("AWB belum tersedia.");
  const response = await bceFetch(env, `/api/v1/partner/shipments/${encodeURIComponent(shipment.awb_number)}/tracking`, { method: "GET" });
  if (!response.ok) throw new BceHttpError("tracking", response.status);
  const tracking = await response.json().catch(() => null) as { status: string; events?: Array<{ id: string; status: string; location?: string | null; notes?: string | null; note?: string | null; created_at: string }> } | null;
  if (!tracking) throw new Error("BCE tidak mengembalikan respons tracking yang valid.");
  let currentStatus = shipment.status;
  for (const item of tracking.events || []) {
    const mapped = mapBceTrackingStatus(item.status);
    if (!mapped) {
      console.warn("[JWLAB BCE] Status event tracking tidak dikenal; status shipment dipertahankan.", {
        awb: shipment.awb_number,
        eventId: item.id,
        status: item.status,
      });
      continue;
    }
    const inserted = await env.DB.prepare("INSERT OR IGNORE INTO shipment_events(id,shipment_id,external_event_id,status,location,note,occurred_at) VALUES(?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), shipment.id, item.id, mapped, item.location || "", item.notes || item.note || "", item.created_at).run();
    if (inserted.meta.changes && rank(mapped) >= rank(currentStatus)) currentStatus = mapped;
  }
  const mappedOverall = mapBceTrackingStatus(tracking.status);
  if (!mappedOverall) {
    console.warn("[JWLAB BCE] Status tracking keseluruhan tidak dikenal; status shipment dipertahankan.", {
      awb: shipment.awb_number,
      status: tracking.status,
    });
  } else if (rank(mappedOverall) >= rank(currentStatus)) {
    currentStatus = mappedOverall;
  }
  const next = ["delivered", "exception"].includes(currentStatus) ? null : new Date(Date.now() + 5 * 60_000).toISOString();
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare("UPDATE shipments SET status=?,error_message=NULL,retry_count=0,next_tracking_at=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(currentStatus, next, shipment.id),
    env.DB.prepare("UPDATE outbox_jobs SET status='completed',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(body.outboxId),
  ];
  if (currentStatus === "delivered") statements.push(...deliveredOrderReconciliationStatements(env.DB, shipment.id, now));
  await env.DB.batch(statements);
}

async function recordQueueFailure(env: OperationsEnv, body: QueueBody, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 300) : "Worker failed";
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare("UPDATE outbox_jobs SET status='failed',attempts=attempts+1,last_error=?,updated_at=? WHERE id=?").bind(message, now, body.outboxId),
  ];
  if (body.orderId) {
    statements.push(env.DB.prepare("UPDATE shipments SET error_message=?,retry_count=retry_count+1,updated_at=? WHERE order_id=?").bind(message, now, body.orderId));
  }
  if (body.shipmentId) {
    statements.push(env.DB.prepare("UPDATE shipments SET error_message=?,retry_count=retry_count+1,updated_at=? WHERE id=?").bind(message, now, body.shipmentId));
  }
  await env.DB.batch(statements);
}

async function expireOrders(env: OperationsEnv) {
  const { results } = await env.DB.prepare("SELECT id FROM orders WHERE payment_status='pending' AND unixepoch(expires_at)<=unixepoch('now') LIMIT 50").all<{ id: string }>();
  for (const order of results) {
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE stock_reservations SET status='released',updated_at=? WHERE order_id=? AND status='active'").bind(now, order.id),
      env.DB.prepare("UPDATE voucher_reservations SET status='released' WHERE order_id=? AND status='active'").bind(order.id),
      env.DB.prepare("UPDATE orders SET status='cancelled',payment_status='expired',cancelled_at=?,updated_at=? WHERE id=? AND payment_status='pending'").bind(now, now, order.id),
      env.DB.prepare("UPDATE payments SET status='expired',updated_at=? WHERE order_id=? AND status='pending'").bind(now, order.id),
      env.DB.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,'cancelled','Masa pembayaran berakhir',?)").bind(crypto.randomUUID(), order.id, now),
    ]);
  }
}

async function scheduleTracking(env: OperationsEnv) {
  const { results } = await env.DB.prepare("SELECT id FROM shipments WHERE status NOT IN ('delivered','exception') AND awb_number IS NOT NULL AND error_message IS NULL AND (next_tracking_at IS NULL OR unixepoch(next_tracking_at)<=unixepoch('now')) LIMIT 50").all<{ id: string }>();
  const now = new Date().toISOString();
  for (const shipment of results) {
    const bucket = Math.floor(Date.now() / 120_000);
    await env.DB.prepare("INSERT OR IGNORE INTO outbox_jobs(id,kind,dedupe_key,payload,status,available_at,created_at,updated_at) VALUES(?,'tracking_reconciliation',?,?,'pending',?,?,?)")
      .bind(crypto.randomUUID(), `${shipment.id}:${bucket}`, JSON.stringify({ shipmentId: shipment.id }), now, now, now).run();
    await env.DB.prepare("UPDATE shipments SET next_tracking_at=? WHERE id=?").bind(new Date(Date.now() + 5 * 60_000).toISOString(), shipment.id).run();
  }
}

async function drainOutbox(env: OperationsEnv) {
  const { results } = await env.DB.prepare("SELECT id,kind,payload FROM outbox_jobs WHERE status='pending' AND unixepoch(available_at)<=unixepoch('now') ORDER BY created_at LIMIT 50").all<{ id: string; kind: string; payload: string }>();
  for (const job of results) {
    try {
      const queue = job.kind === "shipment_creation" ? env.SHIPMENT_QUEUE : env.TRACKING_QUEUE;
      await queue.send({ outboxId: job.id, ...JSON.parse(job.payload) });
      await env.DB.prepare("UPDATE outbox_jobs SET status='sent',attempts=attempts+1,last_error=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(job.id).run();
    } catch (error) {
      await env.DB.prepare("UPDATE outbox_jobs SET status='pending',attempts=attempts+1,last_error=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
        .bind(error instanceof Error ? error.message.slice(0, 300) : "Queue send failed", job.id).run();
    }
  }
}

export default {
  async fetch() { return new Response("JWLAB operations worker", { status: 200 }); },
  async queue(batch: MessageBatch<QueueBody>, env: OperationsEnv) {
    for (const message of batch.messages) {
      try {
        if (batch.queue.includes("shipments")) await processShipment(env, message.body);
        else await processTracking(env, message.body);
        message.ack();
      } catch (error) {
        await recordQueueFailure(env, message.body, error);
        if (error instanceof BceHttpError && !error.retryable) message.ack();
        else message.retry({ delaySeconds: Math.min(3600, 30 * 2 ** message.attempts) });
      }
    }
  },
  async scheduled(controller: ScheduledController, env: OperationsEnv, ctx: ExecutionContext) {
    if (controller.cron === "*/2 * * * *") await scheduleTracking(env);
    if (controller.cron === "*/5 * * * *") await expireOrders(env);
    ctx.waitUntil(drainOutbox(env));
  },
} satisfies ExportedHandler<OperationsEnv, QueueBody>;
