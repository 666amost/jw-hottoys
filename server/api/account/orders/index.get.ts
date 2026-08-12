export default defineEventHandler(async (event) => {
  const session = await requireUser(event);
  const { results } = await bindings(event).DB.prepare(`SELECT o.id,o.order_number,o.status,o.payment_status,o.total_amount,o.created_at,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) item_count,
    (SELECT awb_number FROM shipments s WHERE s.order_id=o.id) awb_number
    FROM orders o WHERE o.user_id=? ORDER BY o.created_at DESC`).bind(session.user.id).all();
  return { orders: results };
});
