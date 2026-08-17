import { z } from "zod";

const schema = z.object({ awbNumber: z.string().trim().min(8).max(60).regex(/^[A-Za-z0-9-]+$/) });

export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const admin = await requireAdmin(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "INVALID_AWB", "Nomor resi JNE tidak valid.");
  const orderId = getRouterParam(event, "orderId");
  const db = bindings(event).DB;
  const shipment = await db.prepare(`SELECT s.id,s.awb_number,o.payment_status,o.status
    FROM shipments s JOIN orders o ON o.id=s.order_id WHERE s.order_id=? AND s.provider='JNE'`)
    .bind(orderId).first<{ id: string; awb_number: string | null; payment_status: string; status: string }>();
  if (!shipment) apiError(404, "JNE_SHIPMENT_NOT_FOUND", "Shipment JNE tidak ditemukan.");
  if (shipment.payment_status !== "paid" || ["cancelled", "fulfilled"].includes(shipment.status)) apiError(409, "ORDER_NOT_EDITABLE", "Resi tidak dapat diubah pada status pesanan ini.");
  const awb = parsed.data.awbNumber.toUpperCase();
  const now = new Date().toISOString();
  try {
    await db.batch([
      db.prepare("UPDATE shipments SET awb_number=?,status='awb_created',error_message=NULL,updated_at=? WHERE id=?").bind(awb, now, shipment.id),
      db.prepare("UPDATE orders SET status='processing',updated_at=? WHERE id=? AND status='paid'").bind(now, orderId),
      db.prepare("INSERT INTO shipment_events(id,shipment_id,external_event_id,status,location,note,occurred_at) VALUES(?,?,?,'awb_created','','Resi JNE dimasukkan admin',?)")
        .bind(crypto.randomUUID(), shipment.id, `manual:${awb}:${Date.now()}`, now),
      db.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,'processing',?,?)")
        .bind(crypto.randomUUID(), orderId, `${shipment.awb_number ? "Resi JNE diperbarui" : "Resi JNE ditambahkan"} oleh admin ${admin.user.id}`, now),
    ]);
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) apiError(409, "AWB_ALREADY_USED", "Nomor resi sudah digunakan pesanan lain.");
    throw error;
  }
  return { updated: true, awbNumber: awb };
});
