import { z } from "zod";

const schema = z.object({
  province: z.string().trim().min(1).max(80), city: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100), subdistrict: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().regex(/^\d{5}$/).optional().or(z.literal("")),
});
const cache = new Map<string, { latitude: number; longitude: number }>();
const unavailable = (reason: "rate_limited" | "upstream_unavailable") => ({
  found: false as const,
  reason,
  message: "Pusat peta belum tersedia. Gunakan lokasi saya atau geser pin secara manual.",
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const parsed = schema.safeParse(getQuery(event));
  if (!parsed.success) apiError(422, "INVALID_REGION", "Wilayah untuk peta tidak valid.");
  // Postal-code coverage in OpenStreetMap is incomplete and a mistyped code should
  // not prevent the map from centering on an otherwise valid administrative area.
  const queryText = [parsed.data.subdistrict, parsed.data.district, parsed.data.city, parsed.data.province, "Indonesia"].filter(Boolean).join(", ");
  const key = queryText.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;
  const db = bindings(event).DB;
  const stored = await db.prepare("SELECT latitude,longitude FROM region_geocode_cache WHERE cache_key=?").bind(key)
    .first<{ latitude: number; longitude: number }>();
  if (stored) {
    cache.set(key, stored);
    return stored;
  }
  if (!await consumeRateLimit(db, "geocoder:nominatim", 1, 1)) return unavailable("rate_limited");
  try {
    const config = appConfig(event);
    const params = new URLSearchParams({ q: queryText, format: "jsonv2", limit: "1", countrycodes: "id" });
    const response = await fetch(`${config.geocoderApiUrl.replace(/\/$/, "")}/search?${params}`, {
      headers: { "User-Agent": `JWLAB-STUDIO/1.0 (${config.siteUrl})`, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`GEOCODER_HTTP_${response.status}`);
    const results = await response.json() as Array<{ lat?: string; lon?: string }>;
    const latitude = Number(results[0]?.lat);
    const longitude = Number(results[0]?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("GEOCODER_NOT_FOUND");
    const point = { latitude, longitude };
    cache.set(key, point);
    await db.prepare("INSERT OR REPLACE INTO region_geocode_cache(cache_key,latitude,longitude,created_at) VALUES(?,?,?,?)")
      .bind(key, latitude, longitude, new Date().toISOString()).run();
    return point;
  }
  catch (error) {
    // Geocoding only assists map recentering and must never block address entry.
    // Log the safe upstream reason so production diagnostics remain actionable.
    console.error("[Geocoder] Gagal mencari pusat wilayah", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return unavailable("upstream_unavailable");
  }
});
