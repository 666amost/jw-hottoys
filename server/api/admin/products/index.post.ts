export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const admin = await requireAdmin(event);
  const input = await parseProductForm(event);
  if (!input.image) apiError(422, "IMAGE_REQUIRED", "Gambar produk wajib diunggah.");
  const db = bindings(event).DB;
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const variantId = crypto.randomUUID();
  const uploaded = await uploadProductImage(event, productId, input.image);
  try {
    await db.batch([
      db.prepare("INSERT INTO products(id,category_id,name,slug,short_description,description,published,featured,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
        .bind(productId, input.data.categoryId, input.data.name, input.data.slug, input.data.shortDescription, input.data.description, input.data.published ? 1 : 0, input.data.featured ? 1 : 0, now, now),
      db.prepare("INSERT INTO product_variants(id,product_id,sku,name,regular_price,sale_price,stock_on_hand,reserved_stock,shipping_weight_grams,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,?)")
        .bind(variantId, productId, input.data.sku, input.data.variantName, input.data.regularPrice, input.data.salePrice === "" || input.data.salePrice == null ? null : input.data.salePrice, input.data.stock, 0, input.data.weight, now, now),
      db.prepare("INSERT INTO product_images(id,product_id,storage_path,public_url,byte_size,sort_order,created_at) VALUES(?,?,?,?,?,0,?)")
        .bind(crypto.randomUUID(), productId, uploaded.key, uploaded.url, input.image.data.length, now),
      db.prepare("INSERT INTO inventory_movements(id,variant_id,quantity_delta,reason,created_by,created_at) VALUES(?,?,?,?,?,?)")
        .bind(crypto.randomUUID(), variantId, input.data.stock, "initial_stock", admin.user.id, now),
    ]);
    return { id: productId };
  } catch (error) {
    await bindings(event).PRODUCT_IMAGES.delete(uploaded.key);
    throw error;
  }
});
