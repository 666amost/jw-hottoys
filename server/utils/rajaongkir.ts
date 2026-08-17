import { z } from "zod";

const destinationSchema = z.object({
  id: z.coerce.number().int().positive(),
  label: z.string().default(""),
  province_name: z.string(),
  city_name: z.string(),
  district_name: z.string(),
  subdistrict_name: z.string(),
  zip_code: z.coerce.string(),
});

const costSchema = z.object({
  name: z.string(),
  code: z.string(),
  service: z.string(),
  description: z.string().default(""),
  cost: z.coerce.number().int().nonnegative(),
  etd: z.coerce.string().default(""),
});

const envelope = <T extends z.ZodType>(item: T) => z.object({
  meta: z.object({ code: z.coerce.number(), status: z.union([z.string(), z.boolean()]), message: z.string().default("") }).passthrough(),
  data: z.array(item).nullable(),
}).passthrough();

export type RajaOngkirDestination = z.infer<typeof destinationSchema>;
export type RajaOngkirService = z.infer<typeof costSchema>;

function normalizeRegion(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
    .replace(/^(kotaadministrasi|kabupatenadministrasi|kabupaten|kecamatan|kelurahan|kota|kab|kec|kel|desa)/, "");
  const aliases: Record<string, string> = {
    daerahkhususibukotajakarta: "dkijakarta",
    daerahistimewayogyakarta: "diyogyakarta",
  };
  return aliases[normalized] ?? normalized;
}

function clientConfig(config: ReturnType<typeof appConfig>) {
  if (!config.rajaOngkirApiKey) throw new Error("RAJAONGKIR_NOT_CONFIGURED");
  return { baseUrl: config.rajaOngkirApiUrl.replace(/\/$/, ""), key: config.rajaOngkirApiKey };
}

async function request(config: ReturnType<typeof appConfig>, path: string, init: RequestInit) {
  const { baseUrl, key } = clientConfig(config);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { key, ...init.headers },
    signal: AbortSignal.timeout(12_000),
  });
  const raw = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`RAJAONGKIR_HTTP_${response.status}`);
  return raw;
}

export async function resolveRajaOngkirDestination(config: ReturnType<typeof appConfig>, input: {
  province: string; city: string; district: string; subdistrict: string; postalCode: string;
}) {
  const query = new URLSearchParams({ search: input.postalCode || input.subdistrict, limit: "100", offset: "0" });
  const parsed = envelope(destinationSchema).parse(await request(config, `/destination/domestic-destination?${query}`, { method: "GET" }));
  const matches = (parsed.data ?? []).filter(item =>
    normalizeRegion(item.province_name) === normalizeRegion(input.province)
    && normalizeRegion(item.city_name) === normalizeRegion(input.city)
    && normalizeRegion(item.district_name) === normalizeRegion(input.district)
    && normalizeRegion(item.subdistrict_name) === normalizeRegion(input.subdistrict)
    && (!input.postalCode || item.zip_code === input.postalCode),
  );
  if (matches.length !== 1) throw new Error(matches.length ? "RAJAONGKIR_DESTINATION_AMBIGUOUS" : "RAJAONGKIR_DESTINATION_NOT_FOUND");
  return matches[0]!;
}

export async function calculateJneCosts(config: ReturnType<typeof appConfig>, input: { destinationId: number; weightGrams: number }) {
  const originId = Number(config.rajaOngkirOriginId);
  if (!Number.isInteger(originId) || originId <= 0) throw new Error("RAJAONGKIR_ORIGIN_NOT_CONFIGURED");
  const body = new URLSearchParams({
    origin: String(originId), destination: String(input.destinationId), weight: String(input.weightGrams), courier: "jne",
  });
  const parsed = envelope(costSchema).parse(await request(config, "/calculate/domestic-cost", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  }));
  const services = (parsed.data ?? []).filter(item => item.code.toLowerCase() === "jne" && item.cost >= 0);
  if (!services.length) throw new Error("RAJAONGKIR_NO_SERVICE");
  return services;
}
