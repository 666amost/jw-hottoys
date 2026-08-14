export default defineEventHandler(async (event) => {
  const session = await requireUser(event);
  const db = bindings(event).DB;
  const id = getRouterParam(event, "id");
  const order = await db.prepare(`SELECT o.*,p.payment_url,p.expires_at payment_expires_at,s.id shipment_id,s.awb_number,s.status shipment_status,s.error_message shipment_error
    FROM orders o LEFT JOIN payments p ON p.order_id=o.id LEFT JOIN shipments s ON s.order_id=o.id
    WHERE o.id=? AND o.user_id=?`).bind(id, session.user.id).first();
  if (!order) apiError(404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan.");
  const [items, events] = await Promise.all([
    db.prepare("SELECT * FROM order_items WHERE order_id=?").bind(id).all(),
    db.prepare("SELECT se.* FROM shipment_events se JOIN shipments s ON s.id=se.shipment_id WHERE s.order_id=? ORDER BY se.occurred_at DESC").bind(id).all(),
  ]);
  return { order, items: items.results, shipmentEvents: events.results };
});
