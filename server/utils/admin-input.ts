import { z } from "zod";
import { getWebpValidationError } from "~~/shared/product-image";

export const productSchema = z.object({
  categoryId: z.string().min(1), name: z.string().trim().min(2).max(120), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().trim().max(180).default(""), description: z.string().trim().max(4000).default(""),
  sku: z.string().trim().min(2).max(80), variantName: z.string().trim().min(1).max(100),
  regularPrice: z.coerce.number().int().nonnegative(), salePrice: z.union([z.coerce.number().int().nonnegative(), z.literal(""), z.null()]).optional(),
  stock: z.coerce.number().int().nonnegative().default(0), weight: z.coerce.number().int().positive().max(100000),
  published: z.coerce.boolean().default(false), featured: z.coerce.boolean().default(false),
});

export async function parseProductForm(event: Parameters<typeof readMultipartFormData>[0]) {
  const parts = await readMultipartFormData(event);
  if (!parts) apiError(422, "VALIDATION_ERROR", "Form produk tidak valid.");
  const values: Record<string, unknown> = {};
  let image: { data: Uint8Array; filename?: string; type?: string } | null = null;
  for (const part of parts) {
    if (!part.name) continue;
    if (part.name === "image" && part.data.length) image = { data: part.data, filename: part.filename, type: part.type };
    else values[part.name] = new TextDecoder().decode(part.data);
  }
  values.published = values.published === "true" || values.published === "on";
  values.featured = values.featured === "true" || values.featured === "on";
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) apiError(422, "VALIDATION_ERROR", "Data produk tidak valid.");
  return { data: parsed.data, image };
}

export function verifyWebp(data: Uint8Array) {
  if (getWebpValidationError(data)) apiError(422, "INVALID_IMAGE", "Gambar harus berupa WebP maksimal 3,5 MB.");
}

export async function uploadProductImage(event: Parameters<typeof bindings>[0], productId: string, image: { data: Uint8Array }) {
  verifyWebp(image.data);
  const env = bindings(event);
  if (!env.PRODUCT_IMAGES) apiError(503, "R2_UNAVAILABLE", "Binding R2 belum tersedia.");
  const key = `products/${productId}/${crypto.randomUUID()}.webp`;
  await env.PRODUCT_IMAGES.put(key, image.data, { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } });
  const base = appConfig(event).r2PublicBaseUrl.replace(/\/$/, "");
  return { key, url: base ? `${base}/${key}` : `/api/assets/${key}` };
}
