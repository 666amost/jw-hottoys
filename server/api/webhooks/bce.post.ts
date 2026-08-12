import { z } from "zod";

const schema = z.object({ event_id: z.string().min(1), awb_number: z.string().min(1), status: z.enum(["awb_created","picked_up","in_transit","delivered","exception"]), occurred_at: z.string(), location: z.string().max(120).optional().nullable(), note: z.string().max(300).optional().nullable() });
const rank: Record<string, number> = { pending_awb: 0, awb_created: 1, picked_up: 2, in_transit: 3, delivered: 4, exception: 3 };

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event) || "";
  if (raw.length > 64 * 1024) apiError(413, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  if (!await verifyBceWebhook(appConfig(event), raw, event.headers)) apiError(401, "INVALID_SIGNATURE", "Webhook BCE tidak terverifikasi.");
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) apiError(422, "INVALID_EVENT", "Payload webhook BCE tidak valid.");
  const db = bindings(event).DB;
  const shipment = await db.prepare("SELECT id,status FROM shipments WHERE awb_number=?").bind(parsed.data.awb_number).first<{ id: string; status: string }>();
  if (!shipment) apiError(404, "AWB_NOT_FOUND", "AWB tidak dikenal.");
  const inserted = await db.prepare("INSERT OR IGNORE INTO shipment_events(id,shipment_id,external_event_id,status,location,note,occurred_at,payload) VALUES(?,?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), shipment.id, parsed.data.event_id, parsed.data.status, parsed.data.location ?? "", parsed.data.note ?? "", parsed.data.occurred_at, raw).run();
  if (inserted.meta.changes && ((rank[parsed.data.status] ?? -1) >= (rank[shipment.status] ?? -1) || parsed.data.status === "exception")) {
    await db.prepare("UPDATE shipments SET status=?,updated_at=?,error_message=? WHERE id=?")
      .bind(parsed.data.status, new Date().toISOString(), parsed.data.status === "exception" ? parsed.data.note ?? "BCE exception" : null, shipment.id).run();
  }
  return { received: true, transaction: { result: inserted.meta.changes ? "updated" : "duplicate" } };
});
