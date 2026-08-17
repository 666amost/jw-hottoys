export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = bindings(event).DB;
  const [orders, products, revenue, lowStock, fulfillment, recent] = await Promise.all([
    db.prepare("SELECT COUNT(*) count FROM orders").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) count FROM products").first<{ count: number }>(),
    db.prepare("SELECT COALESCE(SUM(total_amount),0) total FROM orders WHERE payment_status='paid'").first<{ total: number }>(),
    db.prepare("SELECT COUNT(*) count FROM product_variants WHERE stock_on_hand-reserved_stock<=5").first<{ count: number }>(),
    db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN (s.provider='BCE' AND s.awb_number IS NOT NULL AND s.label_printed_at IS NULL) OR (s.provider='JNE' AND s.awb_number IS NULL) THEN 1 ELSE 0 END),0) needs_processing,
      COALESCE(SUM(CASE WHEN (s.provider='BCE' AND s.label_printed_at IS NOT NULL) OR (s.provider='JNE' AND s.awb_number IS NOT NULL) THEN 1 ELSE 0 END),0) processed
      FROM orders o JOIN shipments s ON s.order_id=o.id
      WHERE o.payment_status='paid' AND o.status NOT IN ('fulfilled','cancelled') AND s.status<>'delivered'`)
      .first<{ needs_processing: number; processed: number }>(),
    db.prepare(`SELECT o.id,o.order_number,o.recipient_name,o.payment_status,o.status,o.total_amount,o.created_at,
      s.awb_number,s.status shipment_status,s.error_message shipment_error,s.label_printed_at,s.provider shipping_provider,q.service_name shipping_service
      FROM orders o LEFT JOIN shipments s ON s.order_id=o.id LEFT JOIN shipping_quotes q ON q.order_id=o.id ORDER BY o.created_at DESC LIMIT 5`).all(),
  ]);
  return {
    metrics: {
      orders: orders?.count || 0,
      products: products?.count || 0,
      revenue: revenue?.total || 0,
      lowStock: lowStock?.count || 0,
      needsProcessing: fulfillment?.needs_processing || 0,
      processed: fulfillment?.processed || 0,
    },
    recentOrders: recent.results,
  };
});
