import { z } from "zod";
import serviceRegions from "../data/service-regions.json";
import { SUPPORTED_CITIES, SUPPORTED_PROVINCES } from "~~/shared/address-regions";

type RegionOption = { code: string; name: string };
type ServiceRegions = {
  districtsByCity: Record<string, RegionOption[]>;
  villagesByDistrict: Record<string, RegionOption[]>;
};

const regions = serviceRegions as ServiceRegions;

const querySchema = z.object({ level: z.enum(["provinces", "cities", "districts", "villages"]), parent: z.string().optional().default("") });

export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event));
  if (!query.success) apiError(422, "VALIDATION_ERROR", "Parameter wilayah tidak valid.");
  const { level, parent } = query.data;
  setHeader(event, "Cache-Control", "public, max-age=86400");
  if (level === "provinces") return { regions: SUPPORTED_PROVINCES };
  if (level === "cities") return { regions: SUPPORTED_CITIES.filter((city) => !parent || city.provinceCode === parent) };
  const options = level === "districts"
    ? regions.districtsByCity[parent]
    : regions.villagesByDistrict[parent];
  if (!options) apiError(422, "UNSUPPORTED_REGION", "Wilayah di luar area layanan.");
  return { regions: options };
});
