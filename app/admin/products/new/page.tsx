import { Button } from "@/components/ui/button";
import { ProductImageInput } from "@/components/admin/product-image-input";
import { createProduct } from "../../actions";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name").order("sort_order");
  return <form action={createProduct} className="surface mx-auto max-w-3xl p-7"><p className="eyebrow">Katalog</p><h1 className="mt-2 text-3xl font-black">Produk baru</h1>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error === "image" ? "Gambar gagal diproses. Gunakan JPG, PNG, WebP, atau AVIF maksimal 15 MB." : "Produk belum dapat disimpan."}</p>}<div className="mt-7 grid gap-5 sm:grid-cols-2">
    <label className="field-label sm:col-span-2">Nama produk<input className="field" name="name" required /></label>
    <label className="field-label">Slug<input className="field" name="slug" placeholder="nama-produk" required /></label>
    <label className="field-label">Kategori<select className="field" name="category_id" required>{categories?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label className="field-label">SKU<input className="field" name="sku" required /></label>
    <label className="field-label">Berat kirim (gram)<input className="field" name="weight" type="number" defaultValue={600} min={1} required /></label>
    <label className="field-label">Harga normal<input className="field" name="regular_price" type="number" min={0} required /></label>
    <label className="field-label">Harga jual/coret<input className="field" name="sale_price" type="number" min={0} /></label>
    <label className="field-label">Stok awal<input className="field" name="stock" type="number" min={0} defaultValue={0} required /></label>
    <ProductImageInput label="Upload gambar" />
    <label className="field-label sm:col-span-2">Atau URL gambar eksternal<input className="field" name="image_url" type="url" /></label>
    <label className="field-label sm:col-span-2">Deskripsi<textarea className="field min-h-32" name="description" required /></label>
    <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="featured" /> Featured product</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="published" /> Langsung tayang</label>
  </div><Button type="submit" size="lg" className="mt-8">Simpan produk</Button></form>;
}
