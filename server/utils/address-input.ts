import { z } from "zod";
import { isBceCityCode } from "../../shared/address-regions";

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).max(40), recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  provinceCode: z.string().regex(/^\d{2}$/), cityCode: z.string().regex(/^\d{4}$/),
  districtCode: z.string().regex(/^\d{6}$/), subdistrictCode: z.string().regex(/^\d{10}$/),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  addressLine: z.string().trim().min(8).max(300), landmark: z.string().trim().max(150).default(""),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), isDefault: z.boolean().default(false),
});

export function addressValidationMessage(error: z.ZodError) {
  const field = error.issues[0]?.path[0];
  const messages: Record<string, string> = {
    label: "Label alamat wajib diisi.",
    recipientName: "Nama penerima minimal 2 karakter.",
    phone: "Nomor telepon minimal 8 dan maksimal 20 karakter.",
    provinceCode: "Provinsi tidak valid.",
    cityCode: "Kota atau kabupaten tidak valid.",
    districtCode: "Kecamatan tidak valid.",
    subdistrictCode: "Kelurahan atau desa tidak valid.",
    postalCode: "Kode pos harus terdiri dari tepat 5 angka.",
    addressLine: "Alamat lengkap minimal 8 karakter.",
    latitude: "Titik lintang peta tidak valid.",
    longitude: "Titik bujur peta tidak valid.",
  };
  return typeof field === "string" ? messages[field] || "Alamat tidak valid." : "Alamat tidak valid.";
}

export async function prepareAddressInput(config: ReturnType<typeof appConfig>, data: z.infer<typeof addressInputSchema>, existing?: {
  regionCode: string | null; postalCode: string; destinationId: number | null;
}) {
  const region = resolveRegionCodes(data);
  let destinationId: number | null = null;
  if (!isBceCityCode(data.cityCode)) {
    if (existing?.regionCode === data.subdistrictCode && existing.postalCode === data.postalCode && existing.destinationId) {
      destinationId = existing.destinationId;
    } else {
      const destination = await resolveRajaOngkirDestination(config, {
        province: region.province.name, city: region.city.name, district: region.district.name,
        subdistrict: region.subdistrict.name, postalCode: data.postalCode,
      });
      destinationId = destination.id;
    }
  }
  return {
    ...data,
    province: region.province.name, city: region.city.name, district: region.district.name,
    subdistrict: region.subdistrict.name, regionCode: data.subdistrictCode, destinationId,
  };
}
