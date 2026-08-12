export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = bindings(event).DB;
  const [orders, products, revenue, lowStock, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) count FROM orders").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) count FROM products").first<{ count: number }>(),
    db.prepare("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE payment_status='paid'").first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) count FROM product_variants WHERE stock_on_hand-reserved_stock<=5").first<{ count: number }>(),
    db.prepare("SELECT id,order_number,recipient_name,payment_status,status,total_amount,created_at FROM orders ORDER BY created_at DESC LIMIT 8").all(),
  ]);
  return { metrics: { orders: orders?.count || 0, products: products?.count || 0, revenue: revenue?.total || 0, lowStock: lowStock?.count || 0 }, recentOrders: recent.results };
});
