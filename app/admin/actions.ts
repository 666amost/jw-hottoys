"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { optimizeProductImage } from "@/lib/product-image";
import { createClient } from "@/lib/supabase/server";

async function adminClient() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("ADMIN_REQUIRED");
  return supabase;
}

type AdminClient = Awaited<ReturnType<typeof adminClient>>;

async function uploadProductImage(supabase: AdminClient, imageFile: File) {
  const image = await optimizeProductImage(imageFile);
  const storagePath = `products/${crypto.randomUUID()}.${image.extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(storagePath, image.data, {
      cacheControl: "31536000",
      contentType: image.contentType,
      upsert: false,
    });
  if (error) throw error;

  return {
    storagePath,
    publicUrl: supabase.storage.from("product-images").getPublicUrl(storagePath).data
      .publicUrl,
  };
}

export async function createProduct(formData: FormData) {
  const schema = z.object({
    categoryId: z.string().uuid(),
    name: z.string().trim().min(3).max(160),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/),
    description: z.string().trim().min(10).max(5000),
    sku: z.string().trim().min(2).max(60),
    regularPrice: z.coerce.number().int().min(0),
    salePrice: z.union([z.literal(""), z.coerce.number().int().min(0)]),
    stock: z.coerce.number().int().min(0),
    weight: z.coerce.number().int().min(1),
    imageUrl: z.union([z.literal(""), z.string().trim().url().max(1000)]),
  });
  const input = schema.safeParse({
    categoryId: formData.get("category_id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    regularPrice: formData.get("regular_price"),
    salePrice: formData.get("sale_price"),
    stock: formData.get("stock"),
    weight: formData.get("weight"),
    imageUrl: formData.get("image_url") ?? "",
  });
  if (!input.success) redirect("/admin/products/new?error=invalid");

  const supabase = await adminClient();
  let productImageUrl = input.data.imageUrl;
  let uploadedImage: Awaited<ReturnType<typeof uploadProductImage>> | null = null;
  const imageFile = formData.get("image_file");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImage = await uploadProductImage(supabase, imageFile);
      productImageUrl = uploadedImage.publicUrl;
    } catch {
      redirect("/admin/products/new?error=image");
    }
  }
  const { error } = await supabase.rpc("admin_create_product", {
    p_category_id: input.data.categoryId,
    p_name: input.data.name,
    p_slug: input.data.slug,
    p_description: input.data.description,
    p_sku: input.data.sku,
    p_regular_price: input.data.regularPrice,
    p_sale_price: input.data.salePrice === "" ? null : input.data.salePrice,
    p_stock: input.data.stock,
    p_weight_grams: input.data.weight,
    p_image_url: productImageUrl || null,
    p_featured: formData.get("featured") === "on",
    p_published: formData.get("published") === "on",
  });
  if (error) {
    if (uploadedImage) {
      await supabase.storage.from("product-images").remove([uploadedImage.storagePath]);
    }
    redirect("/admin/products/new?error=save");
  }
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
  const input = z
    .object({
      productId: z.string().uuid(),
      categoryId: z.string().uuid(),
      name: z.string().trim().min(3).max(160),
      slug: z.string().trim().regex(/^[a-z0-9-]+$/),
      description: z.string().trim().min(10).max(5000),
      sku: z.string().trim().min(2).max(60),
      regularPrice: z.coerce.number().int().min(0),
      salePrice: z.union([z.literal(""), z.coerce.number().int().min(0)]),
      weight: z.coerce.number().int().min(1),
      imageUrl: z.union([z.literal(""), z.string().trim().url().max(1000)]),
    })
    .safeParse({
      productId: formData.get("product_id"),
      categoryId: formData.get("category_id"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      sku: formData.get("sku"),
      regularPrice: formData.get("regular_price"),
      salePrice: formData.get("sale_price"),
      weight: formData.get("weight"),
      imageUrl: formData.get("image_url") ?? "",
    });
  if (!input.success) redirect(`/admin/products/${formData.get("product_id")}/edit?error=invalid`);

  const supabase = await adminClient();
  let productImageUrl = input.data.imageUrl;
  let uploadedImage: Awaited<ReturnType<typeof uploadProductImage>> | null = null;
  const { data: existingImage } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", input.data.productId)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  const imageFile = formData.get("image_file");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      uploadedImage = await uploadProductImage(supabase, imageFile);
      productImageUrl = uploadedImage.publicUrl;
    } catch {
      redirect(`/admin/products/${input.data.productId}/edit?error=image`);
    }
  }
  const { error } = await supabase.rpc("admin_update_product", {
    p_product_id: input.data.productId,
    p_category_id: input.data.categoryId,
    p_name: input.data.name,
    p_slug: input.data.slug,
    p_description: input.data.description,
    p_sku: input.data.sku,
    p_regular_price: input.data.regularPrice,
    p_sale_price: input.data.salePrice === "" ? null : input.data.salePrice,
    p_weight_grams: input.data.weight,
    p_image_url: productImageUrl || null,
    p_featured: formData.get("featured") === "on",
    p_published: formData.get("published") === "on",
  });
  if (error) {
    if (uploadedImage) {
      await supabase.storage.from("product-images").remove([uploadedImage.storagePath]);
    }
    redirect(`/admin/products/${input.data.productId}/edit?error=save`);
  }
  if (
    productImageUrl &&
    existingImage?.storage_path.startsWith("products/") &&
    existingImage.storage_path !== uploadedImage?.storagePath
  ) {
    await supabase.storage.from("product-images").remove([existingImage.storage_path]);
  }
  revalidatePath("/");
  revalidatePath(`/products/${input.data.slug}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function createCategory(formData: FormData) {
  const input = z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/),
    description: z.string().trim().max(300),
  }).safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
  });
  if (!input.success) return;
  const supabase = await adminClient();
  await supabase.from("categories").insert(input.data);
  revalidatePath("/admin/products");
}

export async function adjustStock(formData: FormData) {
  const input = z
    .object({
      variantId: z.string().uuid(),
      stock: z.coerce.number().int().min(0),
      note: z.string().trim().max(200),
    })
    .safeParse({
      variantId: formData.get("variant_id"),
      stock: formData.get("stock"),
      note: formData.get("note") ?? "",
    });
  if (!input.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_adjust_stock", {
    p_variant_id: input.data.variantId,
    p_new_stock: input.data.stock,
    p_note: input.data.note,
  });
  revalidatePath("/admin/inventory");
}

export async function createVoucher(formData: FormData) {
  const input = z
    .object({
      code: z.string().trim().min(3).max(32),
      kind: z.enum(["fixed", "percentage"]),
      value: z.coerce.number().int().min(1),
      minimum_spend: z.coerce.number().int().min(0),
      maximum_discount: z.union([z.literal(""), z.coerce.number().int().min(0)]),
      usage_limit: z.union([z.literal(""), z.coerce.number().int().min(1)]),
      per_user_limit: z.coerce.number().int().min(1),
      ends_at: z.string().min(10),
    })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/admin/vouchers?error=invalid");
  const supabase = await adminClient();
  const { error } = await supabase.from("vouchers").insert({
    code: input.data.code.toUpperCase(),
    kind: input.data.kind,
    value: input.data.value,
    minimum_spend: input.data.minimum_spend,
    maximum_discount: input.data.maximum_discount === "" ? null : input.data.maximum_discount,
    usage_limit: input.data.usage_limit === "" ? null : input.data.usage_limit,
    per_user_limit: input.data.per_user_limit,
    ends_at: new Date(input.data.ends_at).toISOString(),
  });
  if (error) redirect("/admin/vouchers?error=save");
  revalidatePath("/admin/vouchers");
  redirect("/admin/vouchers");
}

export async function retryShipment(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("order_id"));
  if (!id.success) return;
  const supabase = await adminClient();
  await supabase.rpc("enqueue_shipment_retry", { p_order_id: id.data });
  revalidatePath("/admin/integrations");
  revalidatePath("/admin/orders");
}

export async function updateOrderStatus(formData: FormData) {
  const input = z.object({
    orderId: z.string().uuid(),
    status: z.enum(["processing", "fulfilled"]),
    note: z.string().trim().max(200),
  }).safeParse({
    orderId: formData.get("order_id"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });
  if (!input.success) return;
  const supabase = await adminClient();
  await supabase.rpc("admin_set_order_status", {
    p_order_id: input.data.orderId,
    p_status: input.data.status,
    p_note: input.data.note,
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${input.data.orderId}`);
}
