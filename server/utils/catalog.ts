import type { Category, Product } from "~~/shared/types";
import { asc } from "drizzle-orm";
import { database } from "../database/client";
import { categories } from "../database/schema";

type CatalogRow = {
  id: string; name: string; slug: string; short_description: string; description: string;
  featured: number; published: number; category_id: string | null; category_name: string | null;
  category_slug: string | null; category_description: string | null; variant_id: string; sku: string;
  variant_name: string; regular_price: number; sale_price: number | null; stock_on_hand: number;
  reserved_stock: number; shipping_weight_grams: number; image_url: string | null;
};

export async function getProducts(db: D1Database, includeUnpublished = false): Promise<Product[]> {
  const { results } = await db.prepare(`
    SELECT p.id,p.name,p.slug,p.short_description,p.description,p.featured,p.published,
      c.id category_id,c.name category_name,c.slug category_slug,c.description category_description,
      v.id variant_id,v.sku,v.name variant_name,v.regular_price,v.sale_price,v.stock_on_hand,v.reserved_stock,v.shipping_weight_grams,
      (SELECT public_url FROM product_images i WHERE i.product_id=p.id ORDER BY sort_order LIMIT 1) image_url
    FROM products p
    LEFT JOIN categories c ON c.id=p.category_id
    JOIN product_variants v ON v.product_id=p.id AND v.active=1
    WHERE (? = 1 OR p.published=1)
    ORDER BY p.featured DESC,p.created_at DESC
  `).bind(includeUnpublished ? 1 : 0).all<CatalogRow>();
  return results.map((row) => ({
    id: row.id, name: row.name, slug: row.slug, shortDescription: row.short_description,
    description: row.description, featured: Boolean(row.featured), published: Boolean(row.published),
    category: { id: row.category_id || "uncategorized", name: row.category_name || "Koleksi Figure", slug: row.category_slug || "koleksi-figure", description: row.category_description },
    images: [row.image_url || "/product-placeholder.svg"],
    variant: { id: row.variant_id, productId: row.id, sku: row.sku, name: row.variant_name, regularPrice: row.regular_price, salePrice: row.sale_price, stockOnHand: row.stock_on_hand, reservedStock: row.reserved_stock, shippingWeightGrams: row.shipping_weight_grams },
  }));
}

export async function getCategories(db: D1Database): Promise<Category[]> {
  return database(db).select({ id: categories.id, name: categories.name, slug: categories.slug, description: categories.description })
    .from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}
