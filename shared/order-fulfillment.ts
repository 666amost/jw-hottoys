export function deliveredOrderReconciliationStatements(db: D1Database, shipmentId: string, now: string): D1PreparedStatement[] {
  return [
    db.prepare(`INSERT INTO order_status_history(id,order_id,status,note,created_at)
      SELECT ?,o.id,'fulfilled','Paket telah diterima',?
      FROM orders o JOIN shipments s ON s.order_id=o.id
      WHERE s.id=? AND o.status IN ('paid','processing')`)
      .bind(crypto.randomUUID(), now, shipmentId),
    db.prepare(`UPDATE orders SET status='fulfilled',updated_at=?
      WHERE id=(SELECT order_id FROM shipments WHERE id=?) AND status IN ('paid','processing')`)
      .bind(now, shipmentId),
  ];
}
