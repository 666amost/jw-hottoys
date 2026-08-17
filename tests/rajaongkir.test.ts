import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateJneCosts, resolveRajaOngkirDestination } from "../server/utils/rajaongkir";

const config = {
  rajaOngkirApiUrl: "https://raja.test/api/v1",
  rajaOngkirApiKey: "server-secret",
  rajaOngkirOriginId: "12345",
} as never;

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("RajaOngkir Shipping Cost client", () => {
  it("resolves one exact destination and keeps the API key in the server header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [
      { id: 77, label: "Sukamaju", province_name: "Jawa Barat", city_name: "Kota Depok", district_name: "Cilodong", subdistrict_name: "Sukamaju", zip_code: "16415" },
      { id: 78, label: "Sukamaju lain", province_name: "Jawa Barat", city_name: "Kabupaten Bogor", district_name: "Jonggol", subdistrict_name: "Sukamaju", zip_code: "16830" },
    ] }));
    vi.stubGlobal("fetch", fetchMock);

    const destination = await resolveRajaOngkirDestination(config, {
      province: "Jawa Barat", city: "Kota Depok", district: "Kecamatan Cilodong", subdistrict: "Kelurahan Sukamaju", postalCode: "16415",
    });

    expect(destination.id).toBe(77);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("search=16415");
    expect(String(url)).not.toContain("server-secret");
    expect(init.headers).toMatchObject({ key: "server-secret" });
  });

  it("rejects ambiguous and invalid destinations", async () => {
    const item = { id: 77, label: "Sukamaju", province_name: "Jawa Barat", city_name: "Depok", district_name: "Cilodong", subdistrict_name: "Sukamaju", zip_code: "16415" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [item, { ...item, id: 78 }] })));
    const input = { province: "Jawa Barat", city: "Depok", district: "Cilodong", subdistrict: "Sukamaju", postalCode: "16415" };
    await expect(resolveRajaOngkirDestination(config, input)).rejects.toThrow("RAJAONGKIR_DESTINATION_AMBIGUOUS");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [] })));
    await expect(resolveRajaOngkirDestination(config, input)).rejects.toThrow("RAJAONGKIR_DESTINATION_NOT_FOUND");
  });

  it("matches official long province names to RajaOngkir abbreviations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [
      { id: 90, label: "Kepulauan Seribu", province_name: "DKI Jakarta", city_name: "Kabupaten Kepulauan Seribu", district_name: "Kepulauan Seribu Utara", subdistrict_name: "Pulau Panggang", zip_code: "14530" },
    ] })));
    const destination = await resolveRajaOngkirDestination(config, {
      province: "Daerah Khusus Ibukota Jakarta", city: "Kabupaten Administrasi Kepulauan Seribu", district: "Kepulauan Seribu Utara", subdistrict: "Pulau Panggang", postalCode: "14530",
    });
    expect(destination.id).toBe(90);
  });

  it("returns all JNE services using one form-encoded tariff request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [
      { name: "Jalur Nugraha Ekakurir", code: "jne", service: "REG", description: "Layanan Reguler", cost: 18000, etd: "2-3 day" },
      { name: "Jalur Nugraha Ekakurir", code: "jne", service: "YES", description: "Yakin Esok Sampai", cost: 32000, etd: "1 day" },
    ] }));
    vi.stubGlobal("fetch", fetchMock);

    const services = await calculateJneCosts(config, { destinationId: 67890, weightGrams: 1250 });

    expect(services.map(item => item.service)).toEqual(["REG", "YES"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(String(init.body)).toBe("origin=12345&destination=67890&weight=1250&courier=jne");
  });

  it("fails closed on HTTP errors, empty services, and missing configuration", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ message: "unauthorized" }, 401)));
    await expect(calculateJneCosts(config, { destinationId: 1, weightGrams: 1000 })).rejects.toThrow("RAJAONGKIR_HTTP_401");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ meta: { code: 200, status: "success", message: "ok" }, data: [] })));
    await expect(calculateJneCosts(config, { destinationId: 1, weightGrams: 1000 })).rejects.toThrow("RAJAONGKIR_NO_SERVICE");
    await expect(calculateJneCosts({ ...config, rajaOngkirOriginId: "" } as never, { destinationId: 1, weightGrams: 1000 })).rejects.toThrow("RAJAONGKIR_ORIGIN_NOT_CONFIGURED");
    await expect(calculateJneCosts({ ...config, rajaOngkirApiKey: "" } as never, { destinationId: 1, weightGrams: 1000 })).rejects.toThrow("RAJAONGKIR_NOT_CONFIGURED");
  });
});
