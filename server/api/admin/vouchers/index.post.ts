import { z } from "zod";
const schema = z.object({ code: z.string().trim().min(2).max(32).transform((v) => v.toUpperCase()), kind: z.enum(["fixed","percentage"]), value: z.number().int().positive(), minimumOrder: z.number().int().nonnegative().default(0), maxDiscount: z.number().int().nonnegative().nullable().optional(), usageLimit: z.number().int().positive().nullable().optional(), startsAt: z.string().nullable().optional(), expiresAt: z.string().nullable().optional() });
export default defineEventHandler(async (event) => {
  assertSafeMutation(event); await requireAdmin(event); const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Voucher tidak valid."); const id = crypto.randomUUID();
  await bindings(event).DB.prepare("INSERT INTO vouchers(id,code,kind,value,minimum_order,max_discount,usage_limit,starts_at,expires_at,active,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,datetime('now'))")
    .bind(id, parsed.data.code, parsed.data.kind, parsed.data.value, parsed.data.minimumOrder, parsed.data.maxDiscount ?? null, parsed.data.usageLimit ?? null, parsed.data.startsAt ?? null, parsed.data.expiresAt ?? null).run();
  return { id };
});
