import { notFound } from "next/navigation";
import { ProductImageInput } from "@/components/admin/product-image-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { updateProduct } from "../../../actions";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ productId }, { error }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*,product_variants(*),product_images(public_url)")
      .eq("id", productId)
      .maybeSingle(),
    supabase.from("categories").select("id,name").order("sort_order"),
  ]);
  if (!product) notFound();
  const variant = product.product_variants?.[0];
  if (!variant) notFound();

  return (
    <form action={updateProduct} className="surface mx-auto max-w-3xl p-7">
      <input type="hidden" name="product_id" value={product.id} />
      <p className="eyebrow">Katalog</p>
      <h1 className="mt-2 text-3xl font-black">Edit produk</h1>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error === "image"
            ? "Gambar gagal diproses. Gunakan JPG, PNG, WebP, atau AVIF maksimal 15 MB."
            : "Perubahan belum dapat disimpan."}
        </p>
      )}
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="field-label sm:col-span-2">Nama produk<input className="field" name="name" defaultValue={product.name} required /></label>
        <label className="field-label">Slug<input className="field" name="slug" defaultValue={product.slug} required /></label>
        <label className="field-label">Kategori<select className="field" name="category_id" defaultValue={product.category_id}>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="field-label">SKU<input className="field" name="sku" defaultValue={variant.sku} required /></label>
        <label className="field-label">Berat kirim (gram)<input className="field" name="weight" type="number" min={1} defaultValue={variant.shipping_weight_grams} required /></label>
        <label className="field-label">Harga normal<input className="field" name="regular_price" type="number" min={0} defaultValue={variant.regular_price} required /></label>
        <label className="field-label">Harga jual/coret<input className="field" name="sale_price" type="number" min={0} defaultValue={variant.sale_price ?? ""} /></label>
        <ProductImageInput label="Ganti gambar" />
        <label className="field-label">Atau URL gambar eksternal<input className="field" name="image_url" type="url" /></label>
        <label className="field-label sm:col-span-2">Deskripsi<textarea className="field min-h-36" name="description" defaultValue={product.description} required /></label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="featured" defaultChecked={product.featured} /> Featured product</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={product.published} /> Tayang</label>
      </div>
      <Button type="submit" size="lg" className="mt-8">Simpan perubahan</Button>
    </form>
  );
}
