"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCityByName, getProvinceByCode } from "@/lib/address-regions";
import { createClient } from "@/lib/supabase/server";

const addressSchema = z.object({
  label: z.string().trim().min(2).max(30),
  recipient_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/),
  province: z.literal("Banten").or(z.literal("DKI Jakarta")),
  city: z.string().trim().refine((city) => Boolean(getCityByName(city))),
  district: z.string().trim().min(2).max(80),
  subdistrict: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().regex(/^[0-9]{5}$/),
  address_line: z.string().trim().min(10).max(300),
  landmark: z.string().trim().max(160),
  latitude: z.coerce.number().min(-6.6).max(-5.8),
  longitude: z.coerce.number().min(106.3).max(107.2),
  is_default: z.boolean(),
}).superRefine((address, context) => {
  const city = getCityByName(address.city);
  const province = city ? getProvinceByCode(city.provinceCode) : undefined;

  if (province?.name !== address.province) {
    context.addIssue({
      code: "custom",
      path: ["province"],
      message: "Provinsi tidak sesuai dengan kota.",
    });
  }
});

export async function saveAddress(formData: FormData) {
  const input = addressSchema.safeParse({
    label: formData.get("label"),
    recipient_name: formData.get("recipient_name"),
    phone: formData.get("phone"),
    province: formData.get("province"),
    city: formData.get("city"),
    district: formData.get("district"),
    subdistrict: formData.get("subdistrict"),
    postal_code: formData.get("postal_code"),
    address_line: formData.get("address_line"),
    landmark: formData.get("landmark") ?? "",
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    is_default: formData.get("is_default") === "on",
  });
  if (!input.success) redirect("/account/addresses/new?error=invalid");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/addresses/new");

  const normalizedAddress = input.data;
  if (normalizedAddress.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase.from("addresses").insert({
    ...normalizedAddress,
    is_default: normalizedAddress.is_default || count === 0,
    user_id: user.id,
  });
  if (error) redirect("/account/addresses/new?error=save");

  await supabase
    .from("profiles")
    .update({ full_name: normalizedAddress.recipient_name, phone: normalizedAddress.phone })
    .eq("id", user.id);
  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id.data);
  revalidatePath("/account/addresses");
}
