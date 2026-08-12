import { z } from "zod";
const schema = z.object({ quantityDelta: z.number().int().min(-100000).max(100000).refine((value) => value !== 0), reason: z.string().trim().min(2).max(200) });
export default defineEventHandler(async (event) => {
  assertSafeMutation(event); const session = await requireAdmin(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Penyesuaian stok tidak valid.");
  const db = bindings(event).DB; const id = getRouterParam(event, "variantId"); const now = new Date().toISOString();
  const [updated] = await db.batch([
    db.prepare("UPDATE product_variants SET stock_on_hand=stock_on_hand+?,updated_at=? WHERE id=? AND stock_on_hand+?>=reserved_stock").bind(parsed.data.quantityDelta, now, id, parsed.data.quantityDelta),
    db.prepare("INSERT INTO inventory_movements(id,variant_id,quantity_delta,reason,created_by,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1").bind(crypto.randomUUID(), id, parsed.data.quantityDelta, parsed.data.reason, session.user.id, now),
  ]);
  if (!updated?.meta.changes) apiError(409, "INVENTORY_CONFLICT", "Stok tidak dapat lebih kecil dari jumlah yang sedang direservasi.");
  return { updated: true };
});
