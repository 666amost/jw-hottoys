export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = bindings(event).DB;
  const [orders, products, revenue, lowStock, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) count FROM orders").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) count FROM products").first<{ count: number }>(),
    db.prepare("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE payment_status='paid'").first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) count FROM product_variants WHERE stock_on_hand-reserved_stock<=5").first<{ count: number }>(),
    db.prepare(`SELECT o.id,o.order_number,o.recipient_name,o.payment_status,o.status,o.total_amount,o.created_at,
      s.awb_number,s.status shipment_status,s.error_message shipment_error
      FROM orders o LEFT JOIN shipments s ON s.order_id=o.id ORDER BY o.created_at DESC LIMIT 5`).all(),
  ]);
  return { metrics: { orders: orders?.count || 0, products: products?.count || 0, revenue: revenue?.total || 0, lowStock: lowStock?.count || 0 }, recentOrders: recent.results };
});
