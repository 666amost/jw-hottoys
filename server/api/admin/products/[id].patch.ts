export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) apiError(400, "PRODUCT_ID_REQUIRED", "ID produk diperlukan.");
  const input = await parseProductForm(event);
  const db = bindings(event).DB;
  const variant = await db.prepare("SELECT id FROM product_variants WHERE product_id=? ORDER BY created_at LIMIT 1").bind(id).first<{ id: string }>();
  if (!variant) apiError(404, "PRODUCT_NOT_FOUND", "Produk tidak ditemukan.");
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    db.prepare("UPDATE products SET category_id=?,name=?,slug=?,short_description=?,description=?,published=?,featured=?,updated_at=? WHERE id=?")
      .bind(input.data.categoryId, input.data.name, input.data.slug, input.data.shortDescription, input.data.description, input.data.published ? 1 : 0, input.data.featured ? 1 : 0, now, id),
    db.prepare("UPDATE product_variants SET sku=?,name=?,regular_price=?,sale_price=?,shipping_weight_grams=?,updated_at=? WHERE id=?")
      .bind(input.data.sku, input.data.variantName, input.data.regularPrice, input.data.salePrice === "" || input.data.salePrice == null ? null : input.data.salePrice, input.data.weight, now, variant.id),
  ];
  if (input.image) {
    const uploaded = await uploadProductImage(event, id, input.image);
    statements.push(db.prepare("INSERT INTO product_images(id,product_id,storage_path,public_url,byte_size,sort_order,created_at) VALUES(?,?,?,?,?,0,?)")
      .bind(crypto.randomUUID(), id, uploaded.key, uploaded.url, input.image.data.length, now));
  }
  await db.batch(statements);
  return { updated: true };
});
