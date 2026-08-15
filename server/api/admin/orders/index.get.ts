export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const requestedBucket = String(getQuery(event).bucket || "all");
  if (!new Set(["all", "needs_processing", "processed"]).has(requestedBucket)) {
    apiError(422, "INVALID_BUCKET", "Filter pesanan tidak valid.");
  }

  const bucketClause = requestedBucket === "needs_processing"
    ? "AND s.label_printed_at IS NULL"
    : requestedBucket === "processed"
      ? "AND s.label_printed_at IS NOT NULL"
      : "";
  const activeClause = requestedBucket === "all" ? "" : `
    WHERE o.payment_status='paid' AND s.awb_number IS NOT NULL
      AND o.status NOT IN ('fulfilled','cancelled') AND s.status<>'delivered' ${bucketClause}`;
  const db = bindings(event).DB;
  const [orders, counts] = await Promise.all([
    db.prepare(`SELECT o.*,s.id shipment_id,s.awb_number,s.status shipment_status,
      s.error_message shipment_error,s.label_printed_at
      FROM orders o LEFT JOIN shipments s ON s.order_id=o.id
      ${activeClause} ORDER BY o.created_at DESC`).all(),
    db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN s.label_printed_at IS NULL THEN 1 ELSE 0 END),0) needs_processing,
      COALESCE(SUM(CASE WHEN s.label_printed_at IS NOT NULL THEN 1 ELSE 0 END),0) processed
      FROM orders o JOIN shipments s ON s.order_id=o.id
      WHERE o.payment_status='paid' AND s.awb_number IS NOT NULL
        AND o.status NOT IN ('fulfilled','cancelled') AND s.status<>'delivered'`)
      .first<{ needs_processing: number; processed: number }>(),
  ]);
  return {
    orders: orders.results,
    counts: {
      needsProcessing: counts?.needs_processing || 0,
      processed: counts?.processed || 0,
    },
  };
});
