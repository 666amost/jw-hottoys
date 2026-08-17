import { z } from "zod";
import { isBceCityCode } from "~~/shared/address-regions";

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).max(40), recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  provinceCode: z.string().regex(/^\d{2}$/), cityCode: z.string().regex(/^\d{4}$/),
  districtCode: z.string().regex(/^\d{6}$/), subdistrictCode: z.string().regex(/^\d{10}$/),
  postalCode: z.string().trim().regex(/^\d{5}$/),
  addressLine: z.string().trim().min(8).max(300), landmark: z.string().trim().max(150).default(""),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), isDefault: z.boolean().default(false),
});

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
