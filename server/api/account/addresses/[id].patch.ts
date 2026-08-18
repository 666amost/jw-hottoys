export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const parsed = addressInputSchema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", addressValidationMessage(parsed.error));
  const id = getRouterParam(event, "id");
  const db = bindings(event).DB;
  const owned = await db.prepare("SELECT id,region_code,postal_code,rajaongkir_destination_id FROM addresses WHERE id=? AND user_id=?").bind(id, session.user.id)
    .first<{ id: string; region_code: string | null; postal_code: string; rajaongkir_destination_id: number | null }>();
  if (!owned) apiError(404, "ADDRESS_NOT_FOUND", "Alamat tidak ditemukan.");
  let address: Awaited<ReturnType<typeof prepareAddressInput>>;
  try {
    address = await prepareAddressInput(appConfig(event), parsed.data, {
      regionCode: owned.region_code, postalCode: owned.postal_code, destinationId: owned.rajaongkir_destination_id,
    });
  }
  catch (error) {
    const code = error instanceof Error ? error.message : "ADDRESS_VALIDATION_FAILED";
    const message = code === "RAJAONGKIR_NOT_CONFIGURED" ? "Alamat di luar area BCE belum dapat diverifikasi karena RajaOngkir belum dikonfigurasi."
      : code.includes("DESTINATION") ? "Wilayah atau kode pos tidak cocok dengan tujuan RajaOngkir."
        : code === "INVALID_REGION_HIERARCHY" ? "Urutan wilayah alamat tidak valid."
          : "Alamat di luar area BCE belum dapat diverifikasi. Silakan coba lagi.";
    apiError(422, code, message);
  }
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  if (address.isDefault) statements.push(db.prepare("UPDATE addresses SET is_default=0,updated_at=? WHERE user_id=?").bind(now, session.user.id));
  statements.push(db.prepare("DELETE FROM checkout_shipping_quotes WHERE address_id=? AND user_id=?").bind(id, session.user.id));
  statements.push(db.prepare(`UPDATE addresses SET label=?,recipient_name=?,phone=?,province=?,city=?,district=?,subdistrict=?,postal_code=?,address_line=?,landmark=?,latitude=?,longitude=?,is_default=?,region_code=?,rajaongkir_destination_id=?,updated_at=? WHERE id=? AND user_id=?`)
    .bind(address.label, address.recipientName, address.phone, address.province, address.city, address.district, address.subdistrict, address.postalCode, address.addressLine, address.landmark, address.latitude, address.longitude, address.isDefault ? 1 : 0, address.regionCode, address.destinationId, now, id, session.user.id));
  await db.batch(statements);
  return { id };
});
