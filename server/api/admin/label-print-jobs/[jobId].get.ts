type PrintOrderRow = {
  sort_order: number;
  id: string;
  order_number: string;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  awb_number: string;
  total_weight_grams: number;
  billable_weight_kg: number;
};

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const jobId = getRouterParam(event, "jobId");
  const db = bindings(event).DB;
  const job = await db.prepare(`SELECT j.id,j.created_at,u.name created_by_name
    FROM shipment_label_print_jobs j JOIN user u ON u.id=j.created_by WHERE j.id=?`)
    .bind(jobId).first<{ id: string; created_at: string; created_by_name: string }>();
  if (!job) apiError(404, "PRINT_JOB_NOT_FOUND", "Print job tidak ditemukan.");

  const { results: orderRows } = await db.prepare(`SELECT ji.sort_order,o.id,o.order_number,
    o.recipient_name,o.recipient_phone,o.shipping_address,s.awb_number,
    q.total_weight_grams,q.billable_weight_kg
    FROM shipment_label_print_job_items ji
    JOIN shipments s ON s.id=ji.shipment_id
    JOIN orders o ON o.id=s.order_id
    JOIN shipping_quotes q ON q.order_id=o.id
    WHERE ji.job_id=? ORDER BY ji.sort_order`).bind(jobId).all<PrintOrderRow>();
  if (!orderRows.length) apiError(404, "PRINT_JOB_EMPTY", "Print job tidak memiliki label.");

  const placeholders = orderRows.map(() => "?").join(",");
  const { results: itemRows } = await db.prepare(`SELECT order_id,product_name,variant_name,sku,quantity
    FROM order_items WHERE order_id IN (${placeholders}) ORDER BY rowid`)
    .bind(...orderRows.map(row => row.id))
    .all<{ order_id: string; product_name: string; variant_name: string; sku: string; quantity: number }>();
  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const items = itemsByOrder.get(item.order_id) ?? [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  }

  return {
    job,
    labels: orderRows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      recipientName: row.recipient_name,
      recipientPhone: row.recipient_phone,
      shippingAddress: JSON.parse(row.shipping_address) as Record<string, unknown>,
      awbNumber: row.awb_number,
      totalWeightGrams: row.total_weight_grams,
      billableWeightKg: row.billable_weight_kg,
      items: itemsByOrder.get(row.id) ?? [],
    })),
  };
});
