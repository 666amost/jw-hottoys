import { z } from "zod";

const schema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
});

type PrintableOrderRow = {
  id: string;
  status: string;
  payment_status: string;
  shipment_id: string;
  awb_number: string | null;
  shipment_status: string;
  label_printed_at: string | null;
};

export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const admin = await requireAdmin(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Pilih minimal satu dan maksimal 100 pesanan.");

  const orderIds = [...new Set(parsed.data.orderIds)];
  const placeholders = orderIds.map(() => "?").join(",");
  const db = bindings(event).DB;
  const { results } = await db.prepare(`SELECT o.id,o.status,o.payment_status,
    s.id shipment_id,s.awb_number,s.status shipment_status,s.label_printed_at
    FROM orders o JOIN shipments s ON s.order_id=o.id
    WHERE o.id IN (${placeholders})`).bind(...orderIds).all<PrintableOrderRow>();
  const byOrderId = new Map(results.map(row => [row.id, row]));
  const orderedRows = orderIds.map(id => byOrderId.get(id));
  const hasStaleSelection = orderedRows.some(row => !row
    || row.payment_status !== "paid"
    || !row.awb_number
    || row.status === "fulfilled"
    || row.status === "cancelled"
    || row.shipment_status === "delivered");
  if (hasStaleSelection) {
    apiError(409, "PRINT_SELECTION_STALE", "Sebagian pesanan tidak lagi dapat dicetak. Muat ulang daftar pesanan.");
  }

  const now = new Date().toISOString();
  const jobId = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT INTO shipment_label_print_jobs(id,created_by,created_at) VALUES(?,?,?)")
      .bind(jobId, admin.user.id, now),
  ];

  orderedRows.forEach((row, index) => {
    if (!row) return;
    statements.push(
      db.prepare("INSERT INTO shipment_label_print_job_items(job_id,shipment_id,sort_order) VALUES(?,?,?)")
        .bind(jobId, row.shipment_id, index),
    );
    if (!row.label_printed_at) {
      statements.push(
        db.prepare(`INSERT INTO order_status_history(id,order_id,status,note,created_at)
          SELECT ?,?,'processing','Label pengiriman dicetak',?
          WHERE EXISTS(SELECT 1 FROM shipments WHERE id=? AND label_printed_at IS NULL)`)
          .bind(crypto.randomUUID(), row.id, now, row.shipment_id),
        db.prepare("UPDATE orders SET status='processing',updated_at=? WHERE id=? AND status='paid'")
          .bind(now, row.id),
        db.prepare("UPDATE shipments SET label_printed_at=?,updated_at=? WHERE id=? AND label_printed_at IS NULL")
          .bind(now, now, row.shipment_id),
      );
    }
  });

  await db.batch(statements);
  return {
    jobId,
    labelCount: orderedRows.length,
    printUrl: `/admin/awbprint?job_id=${encodeURIComponent(jobId)}&first_time=1`,
  };
});
