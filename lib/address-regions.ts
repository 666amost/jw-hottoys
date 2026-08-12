export type SupportedProvince = {
  code: string;
  name: "Banten" | "DKI Jakarta";
};

export type SupportedCity = {
  code: string;
  name: string;
  provinceCode: SupportedProvince["code"];
};

export type RegionOption = {
  code: string;
  name: string;
};

export const SUPPORTED_PROVINCES = [
  { code: "31", name: "DKI Jakarta" },
  { code: "36", name: "Banten" },
] as const satisfies readonly SupportedProvince[];

export const SUPPORTED_CITIES = [
  { code: "31.73", name: "Jakarta Pusat", provinceCode: "31" },
  { code: "31.71", name: "Jakarta Selatan", provinceCode: "31" },
  { code: "31.74", name: "Jakarta Barat", provinceCode: "31" },
  { code: "31.72", name: "Jakarta Timur", provinceCode: "31" },
  { code: "31.75", name: "Jakarta Utara", provinceCode: "31" },
  { code: "36.71", name: "Tangerang", provinceCode: "36" },
  { code: "36.74", name: "Tangerang Selatan", provinceCode: "36" },
] as const satisfies readonly SupportedCity[];

const supportedCityCodes = new Set<string>(SUPPORTED_CITIES.map((city) => city.code));

export function getCitiesForProvince(provinceCode: string) {
  return SUPPORTED_CITIES.filter((city) => city.provinceCode === provinceCode);
}

export function getProvinceByCode(provinceCode: string) {
  return SUPPORTED_PROVINCES.find((province) => province.code === provinceCode);
}

export function getCityByCode(cityCode: string) {
  return SUPPORTED_CITIES.find((city) => city.code === cityCode);
}

export function getCityByName(cityName: string) {
  return SUPPORTED_CITIES.find((city) => city.name === cityName);
}

export function isAllowedRegionParent(
  level: "districts" | "villages",
  parentCode: string,
) {
  if (level === "districts") return supportedCityCodes.has(parentCode);

  return (
    /^\d{7}$/.test(parentCode) &&
    SUPPORTED_CITIES.some((city) => parentCode.startsWith(city.code.replace(".", "")))
  );
}
