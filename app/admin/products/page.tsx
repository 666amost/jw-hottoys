import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { createCategory } from "../actions";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("id,name,slug,published,featured,product_variants(id,sku,regular_price,sale_price,stock_on_hand,reserved_stock,shipping_weight_grams)").order("created_at", { ascending: false });
  return <div><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Katalog</p><h1 className="mt-2 text-3xl font-black">Produk</h1></div><Button asChild><Link href="/admin/products/new"><Plus /> Produk baru</Link></Button></div>
    <div className="surface mt-7 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Produk</th><th>SKU</th><th>Harga</th><th>Stok</th><th>Berat</th><th>Status</th></tr></thead><tbody className="divide-y">{products?.map((product) => { const variant = product.product_variants?.[0]; return <tr key={product.id}><td className="p-4"><Link href={`/admin/products/${product.id}/edit`} className="font-bold text-blue-600 hover:underline">{product.name}</Link></td><td>{variant?.sku}</td><td>{formatCurrency(variant?.sale_price ?? variant?.regular_price ?? 0)}</td><td>{variant?.stock_on_hand} <span className="text-xs text-slate-400">({variant?.reserved_stock} reserved)</span></td><td>{variant?.shipping_weight_grams} g</td><td><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{product.published ? "Tayang" : "Draft"}</span></td></tr>; })}</tbody></table></div>
    <form action={createCategory} className="surface mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_2fr_auto]"><label className="field-label">Kategori baru<input className="field" name="name" required /></label><label className="field-label">Slug<input className="field" name="slug" required /></label><label className="field-label">Deskripsi<input className="field" name="description" /></label><Button type="submit" size="sm" className="self-end">Tambah kategori</Button></form>
  </div>;
}
