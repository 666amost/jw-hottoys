import indonesiaRegions from "../data/indonesia-regions.json";

export type RegionOption = { code: string; name: string; latitude?: number | null; longitude?: number | null };
type RegionData = {
  provinces: RegionOption[];
  citiesByProvince: Record<string, RegionOption[]>;
  districtsByCity: Record<string, RegionOption[]>;
  villagesByDistrict: Record<string, RegionOption[]>;
};

const data = indonesiaRegions as RegionData;

export function resolveRegionCodes(input: { provinceCode: string; cityCode: string; districtCode: string; subdistrictCode: string }) {
  const province = data.provinces.find(item => item.code === input.provinceCode);
  const city = data.citiesByProvince[input.provinceCode]?.find(item => item.code === input.cityCode);
  const district = data.districtsByCity[input.cityCode]?.find(item => item.code === input.districtCode);
  const subdistrict = data.villagesByDistrict[input.districtCode]?.find(item => item.code === input.subdistrictCode);
  if (!province || !city || !district || !subdistrict) throw new Error("INVALID_REGION_HIERARCHY");
  return { province, city, district, subdistrict };
}
