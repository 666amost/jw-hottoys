export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { results } = await bindings(event).DB.prepare(`SELECT o.*,s.id shipment_id,s.awb_number,s.status shipment_status,s.error_message shipment_error
    FROM orders o LEFT JOIN shipments s ON s.order_id=o.id ORDER BY o.created_at DESC`).all();
  return { orders: results };
});
