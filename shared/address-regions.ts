export const SUPPORTED_PROVINCES = [
  { code: "31", name: "DKI Jakarta" },
  { code: "36", name: "Banten" },
] as const;

export const SUPPORTED_CITIES = [
  { code: "31.71", name: "Jakarta Pusat", provinceCode: "31" },
  { code: "31.74", name: "Jakarta Selatan", provinceCode: "31" },
  { code: "31.73", name: "Jakarta Barat", provinceCode: "31" },
  { code: "31.75", name: "Jakarta Timur", provinceCode: "31" },
  { code: "31.72", name: "Jakarta Utara", provinceCode: "31" },
  { code: "36.71", name: "Tangerang", provinceCode: "36" },
  { code: "36.74", name: "Tangerang Selatan", provinceCode: "36" },
] as const;

export function isAllowedRegionParent(level: "districts" | "villages", parentCode: string) {
  if (level === "districts") return SUPPORTED_CITIES.some((city) => city.code === parentCode);
  return /^\d{2}\.\d{2}\.\d{2}$/.test(parentCode) && SUPPORTED_CITIES.some((city) => parentCode.startsWith(`${city.code}.`));
}
