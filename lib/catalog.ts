import "server-only";

import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { demoCategories, demoProducts } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  featured: boolean;
  published: boolean;
  categories: { id: string; name: string; slug: string; description: string | null } | null;
  product_images: { storage_path: string; public_url: string | null; sort_order: number }[];
  product_variants: {
    id: string;
    sku: string;
    name: string;
    regular_price: number;
    sale_price: number | null;
    stock_on_hand: number;
    reserved_stock: number;
    shipping_weight_grams: number;
  }[];
};

function describeCatalogError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause: error.cause ? String(error.cause) : undefined,
    };
  }

  if (error && typeof error === "object") {
    const details = error as Record<string, unknown>;
    return {
      code: details.code,
      message: details.message,
      details: details.details,
      hint: details.hint,
    };
  }

  return { message: String(error) };
}

function mapProduct(row: ProductRow): Product | null {
  const variant = row.product_variants?.[0];
  if (!variant) return null;

  const category: Category = row.categories
    ? {
        id: row.categories.id,
        name: row.categories.name,
        slug: row.categories.slug,
        description: row.categories.description,
      }
    : { id: "uncategorized", name: "Produk 3D Print", slug: "produk-3d-print" };

  const images = [...(row.product_images || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.public_url)
    .filter((url): url is string => Boolean(url));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description || "",
    description: row.description || "",
    category,
    images: images.length ? images : ["/product-placeholder.svg"],
    featured: row.featured,
    published: row.published,
    variant: {
      id: variant.id,
      productId: row.id,
      sku: variant.sku,
      name: variant.name,
      regularPrice: Number(variant.regular_price),
      salePrice: variant.sale_price == null ? null : Number(variant.sale_price),
      stockOnHand: variant.stock_on_hand,
      reservedStock: variant.reserved_stock,
      shippingWeightGrams: variant.shipping_weight_grams,
    },
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  if (!isSupabaseConfigured()) return demoProducts;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, short_description, description, featured, published,
        categories (id, name, slug, description),
        product_images (storage_path, public_url, sort_order),
        product_variants (
          id, sku, name, regular_price, sale_price, stock_on_hand,
          reserved_stock, shipping_weight_grams
        )
      `)
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    const products = ((data || []) as unknown as ProductRow[])
      .map(mapProduct)
      .filter((product): product is Product => product !== null);
    return products;
  } catch (error) {
    unstable_rethrow(error);
    console.error(
      "[catalog] Falling back to demo catalog:",
      JSON.stringify(describeCatalogError(error)),
    );
    return demoProducts;
  }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const products = await getProducts();
  const unique = new Map(products.map((product) => [product.category.id, product.category]));
  return unique.size ? [...unique.values()] : demoCategories;
});

export async function getProductBySlug(slug: string) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug) || null;
}

export async function searchProducts(query: string, category?: string) {
  const products = await getProducts();
  const normalized = query.trim().toLocaleLowerCase("id");

  return products.filter((product) => {
    const matchesQuery =
      !normalized ||
      `${product.name} ${product.shortDescription} ${product.variant.sku}`
        .toLocaleLowerCase("id")
        .includes(normalized);
    const matchesCategory = !category || product.category.slug === category;
    return matchesQuery && matchesCategory;
  });
}
