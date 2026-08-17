export default defineEventHandler(async (event) => {
  const session = await requireUser(event);
  const { results } = await bindings(event).DB.prepare(`SELECT o.id,o.order_number,o.status,o.payment_status,o.total_amount,o.created_at,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) item_count,
    s.provider shipping_provider,s.awb_number,s.status shipment_status,s.error_message shipment_error,q.service_name shipping_service
    FROM orders o LEFT JOIN shipments s ON s.order_id=o.id LEFT JOIN shipping_quotes q ON q.order_id=o.id
    WHERE o.user_id=? ORDER BY o.created_at DESC`).bind(session.user.id).all();
  return { orders: results };
});
