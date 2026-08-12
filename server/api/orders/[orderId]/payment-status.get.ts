export default defineEventHandler(async (event) => {
  const session = await requireUser(event);
  const identifier = getRouterParam(event, "orderId");
  const row = await bindings(event).DB.prepare(`SELECT o.id,o.order_number,o.payment_status,p.expires_at,s.awb_number,s.status shipment_status
    FROM orders o LEFT JOIN payments p ON p.order_id=o.id LEFT JOIN shipments s ON s.order_id=o.id
    WHERE (o.id=? OR o.order_number=?) AND o.user_id=?`).bind(identifier, identifier, session.user.id).first();
  if (!row) apiError(404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan.");
  return row;
});
