import { z } from "zod";
import indonesiaRegions from "../data/indonesia-regions.json";

type RegionOption = { code: string; name: string; latitude?: number | null; longitude?: number | null };
type ServiceRegions = {
  provinces: RegionOption[];
  citiesByProvince: Record<string, RegionOption[]>;
  districtsByCity: Record<string, RegionOption[]>;
  villagesByDistrict: Record<string, RegionOption[]>;
};

const regions = indonesiaRegions as ServiceRegions;

const querySchema = z.object({ level: z.enum(["provinces", "cities", "districts", "villages"]), parent: z.string().optional().default("") });

export default defineEventHandler(async (event) => {
  const query = querySchema.safeParse(getQuery(event));
  if (!query.success) apiError(422, "VALIDATION_ERROR", "Parameter wilayah tidak valid.");
  const { level, parent } = query.data;
  setHeader(event, "Cache-Control", "public, max-age=86400");
  if (level === "provinces") return { regions: regions.provinces };
  const options = level === "cities" ? regions.citiesByProvince[parent]
    : level === "districts" ? regions.districtsByCity[parent]
      : regions.villagesByDistrict[parent];
  if (!options) apiError(422, "REGION_NOT_FOUND", "Data wilayah tidak ditemukan.");
  return { regions: options };
});
