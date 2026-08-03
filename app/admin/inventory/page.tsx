import { Button } from "@/components/ui/button";
import { adjustStock } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id,sku,stock_on_hand,reserved_stock,regular_price,sale_price,products(name)")
    .order("sku");
  return (
    <div>
      <p className="eyebrow">Gudang</p>
      <h1 className="mt-2 text-3xl font-black">Inventory</h1>
      <div className="mt-7 grid gap-4">
        {variants?.map((variant) => {
          const productRelation = variant.products as unknown as { name?: string } | Array<{ name?: string }> | null;
          const product = Array.isArray(productRelation) ? productRelation[0] : productRelation;
          return (
            <form
              key={variant.id}
              action={adjustStock}
              className="surface grid items-end gap-4 p-5 sm:grid-cols-[1fr_120px_120px_1fr_auto]"
            >
              <input type="hidden" name="variant_id" value={variant.id} />
              <div>
                <p className="font-black">{product?.name}</p>
                <p className="text-xs text-slate-500">{variant.sku} · {variant.reserved_stock} reserved</p>
              </div>
              <label className="field-label">Stok total<input name="stock" type="number" min={variant.reserved_stock} defaultValue={variant.stock_on_hand} className="field" /></label>
              <label className="field-label">Harga normal<input name="regular_price" type="number" min={0} defaultValue={variant.regular_price ?? 0} className="field" /></label>
              <label className="field-label">Harga jual<input name="sale_price" type="number" min={0} defaultValue={variant.sale_price ?? ""} className="field" /></label>
              <label className="field-label">Catatan<input name="note" className="field" placeholder="Stock opname" /></label>
              <Button type="submit" size="sm">Simpan</Button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
