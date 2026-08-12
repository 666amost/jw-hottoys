import { z } from "zod";

const schema = z.object({
  label: z.string().trim().min(1).max(40), recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20), province: z.string().trim().min(1), city: z.string().trim().min(1),
  district: z.string().trim().min(1), subdistrict: z.string().trim().min(1), postalCode: z.string().trim().min(5).max(10),
  addressLine: z.string().trim().min(8).max(300), landmark: z.string().trim().max(150).default(""),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), isDefault: z.boolean().default(false),
});

export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Alamat tidak valid.");
  const id = getRouterParam(event, "id");
  const db = bindings(event).DB;
  const owned = await db.prepare("SELECT id FROM addresses WHERE id=? AND user_id=?").bind(id, session.user.id).first();
  if (!owned) apiError(404, "ADDRESS_NOT_FOUND", "Alamat tidak ditemukan.");
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  if (parsed.data.isDefault) statements.push(db.prepare("UPDATE addresses SET is_default=0,updated_at=? WHERE user_id=?").bind(now, session.user.id));
  statements.push(db.prepare(`UPDATE addresses SET label=?,recipient_name=?,phone=?,province=?,city=?,district=?,subdistrict=?,postal_code=?,address_line=?,landmark=?,latitude=?,longitude=?,is_default=?,updated_at=? WHERE id=? AND user_id=?`)
    .bind(parsed.data.label, parsed.data.recipientName, parsed.data.phone, parsed.data.province, parsed.data.city, parsed.data.district, parsed.data.subdistrict, parsed.data.postalCode, parsed.data.addressLine, parsed.data.landmark, parsed.data.latitude, parsed.data.longitude, parsed.data.isDefault ? 1 : 0, now, id, session.user.id));
  await db.batch(statements);
  return { id };
});
