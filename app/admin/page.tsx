import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ count: orders }, { count: products }, { data: paid }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
  ]);
  const revenue = paid?.reduce((sum, order) => sum + order.total_amount, 0) ?? 0;
  const cards = [
    ["Total order", String(orders ?? 0)],
    ["Produk", String(products ?? 0)],
    ["Pembayaran terkonfirmasi", formatCurrency(revenue)],
  ];
  return (
    <div>
      <p className="eyebrow">Control room</p><h1 className="mt-2 text-3xl font-black">Dashboard toko</h1>
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {cards.map(([label, value]) => <div key={label} className="surface p-6"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-3 text-2xl font-black">{value}</p></div>)}
      </div>
    </div>
  );
}

