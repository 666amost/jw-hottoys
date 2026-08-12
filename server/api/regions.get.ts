import { z } from "zod";
import { SUPPORTED_CITIES, SUPPORTED_PROVINCES, isAllowedRegionParent } from "~~/shared/address-regions";

const querySchema = z.object({ level: z.enum(["provinces", "cities", "districts", "villages"]), parent: z.string().optional().default("") });

export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event));
  if (!query.success) apiError(422, "VALIDATION_ERROR", "Parameter wilayah tidak valid.");
  const { level, parent } = query.data;
  if (level === "provinces") return { regions: SUPPORTED_PROVINCES };
  if (level === "cities") return { regions: SUPPORTED_CITIES.filter((city) => !parent || city.provinceCode === parent) };
  if (!isAllowedRegionParent(level, parent)) apiError(422, "UNSUPPORTED_REGION", "Wilayah di luar area layanan.");
  const upstream = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/${level}/${encodeURIComponent(parent)}.json`, { signal: AbortSignal.timeout(8_000) });
  if (!upstream.ok) apiError(502, "REGION_PROVIDER_ERROR", "Data wilayah belum dapat dimuat.");
  const rows = await upstream.json() as Array<{ id: string; name: string }>;
  return { regions: rows.map((row) => ({ code: row.id, name: row.name })) };
});
