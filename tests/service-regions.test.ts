import { describe, expect, it } from "vitest";
import serviceRegions from "../server/data/service-regions.json";
import { SUPPORTED_CITIES } from "../shared/address-regions";

describe("local service region dataset", () => {
  it("contains districts for every supported city", () => {
    for (const city of SUPPORTED_CITIES) {
      expect(serviceRegions.districtsByCity[city.code]?.length, city.name).toBeGreaterThan(0);
    }
  });

  it("contains villages for every available district", () => {
    const districts = Object.values(serviceRegions.districtsByCity).flat();
    for (const district of districts) {
      expect(serviceRegions.villagesByDistrict[district.code]?.length, district.name).toBeGreaterThan(0);
    }
  });

  it("maps Jakarta Selatan to its correct district data", () => {
    expect(serviceRegions.districtsByCity["31.71"].map((district) => district.name)).toContain("Kebayoran Baru");
  });
});
