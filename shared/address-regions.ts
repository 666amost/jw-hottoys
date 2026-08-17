export const BCE_CITY_CODES = new Set(["3171", "3172", "3173", "3174", "3175", "3671", "3674"]);

export const SUPPORTED_PROVINCES = [
  { code: "31", name: "DKI Jakarta" }, { code: "36", name: "Banten" },
] as const;

export const SUPPORTED_CITIES = [
  { code: "3171", name: "Jakarta Pusat", provinceCode: "31" },
  { code: "3172", name: "Jakarta Utara", provinceCode: "31" },
  { code: "3173", name: "Jakarta Barat", provinceCode: "31" },
  { code: "3174", name: "Jakarta Selatan", provinceCode: "31" },
  { code: "3175", name: "Jakarta Timur", provinceCode: "31" },
  { code: "3671", name: "Tangerang", provinceCode: "36" },
  { code: "3674", name: "Tangerang Selatan", provinceCode: "36" },
] as const;

export function isAllowedRegionParent(level: "districts" | "villages", parentCode: string) {
  if (level === "districts") return /^\d{4}$/.test(parentCode);
  return /^\d{6}$/.test(parentCode);
}

export function isBceCityCode(cityCode?: string | null) {
  return Boolean(cityCode && BCE_CITY_CODES.has(cityCode.replaceAll(".", "")));
}
