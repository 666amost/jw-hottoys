import { z } from "zod";
import { calculateShippingFromWeight, isSupportedDestination } from "~~/shared/shipping";
import type { ShippingOption, ShippingProvider } from "~~/shared/shipping-options";

const schema = z.object({
  addressId: z.string().min(1),
  lines: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});
type AddressRow = { id: string; city: string; region_code: string | null; rajaongkir_destination_id: number | null };
type CachedRow = { id: string; provider: ShippingProvider; options: string; expires_at: string };

export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const parsed = schema.safeParse(await readLimitedBody(event));
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Data permintaan ongkir tidak valid.");
  const db = bindings(event).DB;
  if (!await consumeRateLimit(db, `shipping-quote:${session.user.id}`, 20, 60)) apiError(429, "RATE_LIMITED", "Terlalu banyak permintaan ongkir.");
  const address = await db.prepare("SELECT id,city,region_code,rajaongkir_destination_id FROM addresses WHERE id=? AND user_id=?")
    .bind(parsed.data.addressId, session.user.id).first<AddressRow>();
  if (!address) apiError(404, "ADDRESS_NOT_FOUND", "Alamat tidak ditemukan.");
  let cart: Awaited<ReturnType<typeof loadCheckoutCart>>;
  try { cart = await loadCheckoutCart(db, parsed.data.lines); }
  catch { apiError(409, "PRODUCT_CHANGED", "Produk atau berat pengiriman baru saja berubah."); }
  const cached = await db.prepare(`SELECT id,provider,options,expires_at FROM checkout_shipping_quotes
    WHERE user_id=? AND address_id=? AND cart_hash=? AND unixepoch(expires_at)>unixepoch('now')
    ORDER BY created_at DESC LIMIT 1`).bind(session.user.id, address.id, cart.cartHash).first<CachedRow>();
  if (cached) return { quoteId: cached.id, provider: cached.provider, options: JSON.parse(cached.options) as ShippingOption[], expiresAt: cached.expires_at };

  const bce = isSupportedDestination(address.city, address.region_code?.slice(0, 4));
  const provider: ShippingProvider = bce ? "BCE" : "JNE";
  let options: ShippingOption[];
  if (bce) {
    const price = calculateShippingFromWeight(cart.totalWeightGrams);
    options = [{
      provider, serviceCode: "BCE_STANDARD", serviceName: "BCE Express", description: "Pengiriman lokal lima kota Jakarta, Kota Tangerang, dan Tangerang Selatan",
      etd: "", referenceAmount: price.referenceAmount, chargedAmount: price.chargedAmount, discountAmount: price.discountAmount,
    }];
  } else {
    if (!address.rajaongkir_destination_id) apiError(422, "DESTINATION_UNRESOLVED", "Alamat perlu disimpan ulang agar tujuan JNE dapat diverifikasi.");
    try {
      const services = await calculateJneCosts(appConfig(event), { destinationId: address.rajaongkir_destination_id, weightGrams: cart.totalWeightGrams });
      options = services.map(service => ({
        provider, serviceCode: service.service, serviceName: `JNE ${service.service}`, description: service.description,
        etd: service.etd, referenceAmount: service.cost, chargedAmount: service.cost, discountAmount: 0,
      }));
    } catch (error) {
      console.error("[RajaOngkir] Gagal menghitung tarif JNE", error);
      apiError(502, "SHIPPING_RATE_UNAVAILABLE", "Tarif JNE belum tersedia. Silakan coba kembali beberapa saat lagi.");
    }
  }
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60_000).toISOString();
  await db.prepare(`INSERT INTO checkout_shipping_quotes(id,user_id,address_id,cart_hash,total_weight_grams,provider,destination_id,options,expires_at,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(id, session.user.id, address.id, cart.cartHash, cart.totalWeightGrams, provider, address.rajaongkir_destination_id, JSON.stringify(options), expiresAt, now.toISOString()).run();
  return { quoteId: id, provider, options, expiresAt };
});
