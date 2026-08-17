export type CheckoutLineInput = { variantId: string; quantity: number };
export type CheckoutVariantRow = {
  id: string; product_id: string; product_name: string; name: string; sku: string;
  regular_price: number; sale_price: number | null; shipping_weight_grams: number;
};

export async function loadCheckoutCart(db: D1Database, lines: CheckoutLineInput[]) {
  const quantities = new Map<string, number>();
  for (const line of lines) quantities.set(line.variantId, (quantities.get(line.variantId) || 0) + line.quantity);
  const ids = [...quantities.keys()].sort();
  const placeholders = ids.map(() => "?").join(",");
  const { results: variants } = await db.prepare(`
    SELECT v.id,v.product_id,p.name product_name,v.name,v.sku,v.regular_price,v.sale_price,v.shipping_weight_grams
    FROM product_variants v JOIN products p ON p.id=v.product_id
    WHERE v.active=1 AND p.published=1 AND v.id IN (${placeholders})
  `).bind(...ids).all<CheckoutVariantRow>();
  if (variants.length !== ids.length) throw new Error("PRODUCT_CHANGED");
  const totalWeightGrams = variants.reduce((sum, variant) => sum + variant.shipping_weight_grams * (quantities.get(variant.id) || 0), 0);
  if (!Number.isSafeInteger(totalWeightGrams) || totalWeightGrams <= 0) throw new Error("PRODUCT_CHANGED");
  const hashSource = variants.sort((a, b) => a.id.localeCompare(b.id))
    .map(variant => `${variant.id}:${quantities.get(variant.id)}:${variant.shipping_weight_grams}`).join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(hashSource));
  const cartHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  return { quantities, variants, totalWeightGrams, cartHash };
}
