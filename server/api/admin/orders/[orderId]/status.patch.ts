import { z } from "zod";
const schema = z.object({ status: z.enum(["paid","processing","fulfilled","cancelled"]), note: z.string().max(300).optional().default("") });
export default defineEventHandler(async (event) => {
  assertSafeMutation(event); await requireAdmin(event); const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Status order tidak valid."); const id = getRouterParam(event, "orderId"); const now = new Date().toISOString(); const db = bindings(event).DB;
  await db.batch([
    db.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(parsed.data.status, now, id),
    db.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), id, parsed.data.status, parsed.data.note, now),
  ]); return { updated: true };
});
