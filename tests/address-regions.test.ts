import { describe, expect, it } from "vitest";
import {
  getCitiesForProvince,
  getCityByName,
  isAllowedRegionParent,
} from "../lib/address-regions";

describe("address region hierarchy", () => {
  it("only returns cities belonging to the selected province", () => {
    expect(getCitiesForProvince("36").map((city) => city.name)).toEqual([
      "Tangerang",
      "Tangerang Selatan",
    ]);
    expect(getCitiesForProvince("31").every((city) => city.name.startsWith("Jakarta"))).toBe(true);
  });

  it("resolves the canonical city used by address validation", () => {
    expect(getCityByName("Tangerang")?.provinceCode).toBe("36");
    expect(getCityByName("Kota palsu")).toBeUndefined();
  });

  it("only permits district and village lookups inside supported cities", () => {
    expect(isAllowedRegionParent("districts", "36.71")).toBe(true);
    expect(isAllowedRegionParent("districts", "36.03")).toBe(false);
    expect(isAllowedRegionParent("villages", "36.71.10")).toBe(true);
    expect(isAllowedRegionParent("villages", "36.03.10")).toBe(false);
    expect(isAllowedRegionParent("villages", "https://example.com")).toBe(false);
  });
});
