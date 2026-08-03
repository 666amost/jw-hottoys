"use client";

import { useEffect, useState } from "react";
import {
  getCitiesForProvince,
  getCityByCode,
  getProvinceByCode,
  SUPPORTED_PROVINCES,
  type RegionOption,
} from "@/lib/address-regions";

type RegionLevel = "districts" | "villages";

async function loadRegions(
  level: RegionLevel,
  parentCode: string,
  signal: AbortSignal,
) {
  const query = new URLSearchParams({ level, parent: parentCode });
  const response = await fetch(`/api/regions?${query}`, { signal });
  const result = (await response.json()) as {
    data?: RegionOption[];
    error?: string;
  };

  if (!response.ok || !result.data) {
    throw new Error(result.error ?? "Data wilayah gagal dimuat.");
  }

  return result.data;
}

export function AddressRegionFields() {
  const [provinceCode, setProvinceCode] = useState("31");
  const [cityCode, setCityCode] = useState("31.74");
  const [districtCode, setDistrictCode] = useState("");
  const [subdistrictCode, setSubdistrictCode] = useState("");
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [subdistricts, setSubdistricts] = useState<RegionOption[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [subdistrictsLoading, setSubdistrictsLoading] = useState(false);
  const [error, setError] = useState("");

  const cities = getCitiesForProvince(provinceCode);
  const province = getProvinceByCode(provinceCode);
  const city = getCityByCode(cityCode);
  const district = districts.find((option) => option.code === districtCode);
  const subdistrict = subdistricts.find((option) => option.code === subdistrictCode);

  useEffect(() => {
    const controller = new AbortController();

    if (!cityCode) return () => controller.abort();

    loadRegions("districts", cityCode, controller.signal)
      .then(setDistricts)
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Data wilayah gagal dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDistrictsLoading(false);
      });

    return () => controller.abort();
  }, [cityCode]);

  useEffect(() => {
    const controller = new AbortController();

    if (!districtCode) return () => controller.abort();

    loadRegions("villages", districtCode, controller.signal)
      .then(setSubdistricts)
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Data wilayah gagal dimuat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSubdistrictsLoading(false);
      });

    return () => controller.abort();
  }, [districtCode]);

  return (
    <>
      <input type="hidden" name="province" value={province?.name ?? ""} />
      <input type="hidden" name="city" value={city?.name ?? ""} />
      <input type="hidden" name="district" value={district?.name ?? ""} />
      <input type="hidden" name="subdistrict" value={subdistrict?.name ?? ""} />

      <label className="field-label" htmlFor="province">
        Provinsi
        <select
          className="field"
          id="province"
          value={provinceCode}
          onChange={(event) => {
            setProvinceCode(event.target.value);
            setCityCode("");
            setDistrictCode("");
            setSubdistrictCode("");
            setDistricts([]);
            setSubdistricts([]);
            setDistrictsLoading(false);
            setSubdistrictsLoading(false);
            setError("");
          }}
          required
        >
          {SUPPORTED_PROVINCES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label" htmlFor="city">
        Kota
        <select
          className="field"
          id="city"
          value={cityCode}
          onChange={(event) => {
            const nextCityCode = event.target.value;
            setCityCode(nextCityCode);
            setDistrictCode("");
            setSubdistrictCode("");
            setDistricts([]);
            setSubdistricts([]);
            setDistrictsLoading(Boolean(nextCityCode));
            setSubdistrictsLoading(false);
            setError("");
          }}
          required
        >
          <option value="">Pilih kota</option>
          {cities.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label" htmlFor="district">
        Kecamatan
        <select
          className="field"
          id="district"
          value={districtCode}
          onChange={(event) => {
            const nextDistrictCode = event.target.value;
            setDistrictCode(nextDistrictCode);
            setSubdistrictCode("");
            setSubdistricts([]);
            setSubdistrictsLoading(Boolean(nextDistrictCode));
            setError("");
          }}
          disabled={!cityCode || districtsLoading}
          required
        >
          <option value="">
            {districtsLoading ? "Memuat kecamatan..." : "Pilih kecamatan"}
          </option>
          {districts.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label" htmlFor="subdistrict">
        Kelurahan
        <select
          className="field"
          id="subdistrict"
          value={subdistrictCode}
          onChange={(event) => setSubdistrictCode(event.target.value)}
          disabled={!districtCode || subdistrictsLoading}
          required
        >
          <option value="">
            {subdistrictsLoading ? "Memuat kelurahan..." : "Pilih kelurahan"}
          </option>
          {subdistricts.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="sm:col-span-2 -mt-2 text-xs font-semibold text-red-700" role="alert">
          {error} Muat ulang halaman untuk mencoba lagi.
        </p>
      )}
    </>
  );
}
