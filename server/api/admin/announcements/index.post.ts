import { z } from "zod";
const schema = z.object({ label: z.string().trim().min(1).max(40), message: z.string().trim().min(2).max(180), href: z.string().max(300).nullable().optional(), active: z.boolean().default(true), sortOrder: z.number().int().default(0), startsAt: z.string().nullable().optional(), endsAt: z.string().nullable().optional() });
export default defineEventHandler(async (event) => {
  assertSafeMutation(event); await requireAdmin(event); const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Announcement tidak valid."); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await bindings(event).DB.prepare("INSERT INTO site_announcements(id,label,message,href,active,sort_order,starts_at,ends_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .bind(id, parsed.data.label, parsed.data.message, parsed.data.href ?? null, parsed.data.active ? 1 : 0, parsed.data.sortOrder, parsed.data.startsAt ?? null, parsed.data.endsAt ?? null, now, now).run(); return { id };
});
