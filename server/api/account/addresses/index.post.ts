export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const parsed = addressInputSchema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Alamat tidak valid.");
  let address: Awaited<ReturnType<typeof prepareAddressInput>>;
  try { address = await prepareAddressInput(appConfig(event), parsed.data); }
  catch (error) {
    const code = error instanceof Error ? error.message : "ADDRESS_VALIDATION_FAILED";
    const message = code === "RAJAONGKIR_NOT_CONFIGURED" ? "Alamat di luar area BCE belum dapat diverifikasi karena RajaOngkir belum dikonfigurasi."
      : code.includes("DESTINATION") ? "Wilayah atau kode pos tidak cocok dengan tujuan RajaOngkir."
        : code === "INVALID_REGION_HIERARCHY" ? "Urutan wilayah alamat tidak valid."
          : "Alamat di luar area BCE belum dapat diverifikasi. Silakan coba lagi.";
    apiError(422, code, message);
  }
  const db = bindings(event).DB;
  const count = await db.prepare("SELECT COUNT(*) count FROM addresses WHERE user_id=?").bind(session.user.id).first<{ count: number }>();
  const isDefault = address.isDefault || !count?.count;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [];
  if (isDefault) statements.push(db.prepare("UPDATE addresses SET is_default=0,updated_at=? WHERE user_id=?").bind(now, session.user.id));
  statements.push(db.prepare(`INSERT INTO addresses(id,user_id,label,recipient_name,phone,province,city,district,subdistrict,postal_code,address_line,landmark,latitude,longitude,is_default,created_at,updated_at,region_code,rajaongkir_destination_id)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, session.user.id, address.label, address.recipientName, address.phone, address.province, address.city, address.district, address.subdistrict, address.postalCode, address.addressLine, address.landmark, address.latitude, address.longitude, isDefault ? 1 : 0, now, now, address.regionCode, address.destinationId));
  await db.batch(statements);
  return { id };
});
