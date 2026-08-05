import {
  ArrowRight,
  CurrencyCircleDollar,
  Megaphone,
  Package,
  Plus,
  ShoppingBagOpen,
  Warning,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const statusStyles: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-700 ring-amber-600/10",
  paid: "bg-blue-50 text-blue-700 ring-blue-600/10",
  processing: "bg-violet-50 text-violet-700 ring-violet-600/10",
  fulfilled: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Menunggu bayar",
  paid: "Sudah dibayar",
  processing: "Diproses",
  fulfilled: "Selesai",
  cancelled: "Dibatalkan",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [ordersResult, productsResult, paidResult, lowStockResult, latestOrdersResult] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).lte("stock_on_hand", 5),
    supabase
      .from("orders")
      .select("id,order_number,recipient_name,status,total_amount,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const revenue = paidResult.data?.reduce((sum, order) => sum + order.total_amount, 0) ?? 0;
  const stats = [
    {
      label: "Total pesanan",
      value: String(ordersResult.count ?? 0),
      helper: "Semua pesanan masuk",
      icon: ShoppingBagOpen,
      color: "bg-blue-50 text-[#1746a2]",
    },
    {
      label: "Produk",
      value: String(productsResult.count ?? 0),
      helper: "Produk dalam katalog",
      icon: Package,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Pendapatan terbayar",
      value: formatCurrency(revenue),
      helper: "Pembayaran terkonfirmasi",
      icon: CurrencyCircleDollar,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Stok menipis",
      value: String(lowStockResult.count ?? 0),
      helper: "Varian dengan stok ≤ 5",
      icon: Warning,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  const quickActions = [
    { href: "/admin/products/new", label: "Tambah produk baru", helper: "Buat produk dan varian", icon: Plus },
    { href: "/admin/inventory", label: "Perbarui inventory", helper: "Atur stok dan harga", icon: Package },
    { href: "/admin/content", label: "Kelola billboard", helper: "Ubah informasi di website", icon: Megaphone },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Ringkasan hari ini</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Dashboard toko</h1>
          <p className="mt-2 text-sm text-slate-500">Pantau operasional dan kelola toko dari satu tempat.</p>
        </div>
        <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          {new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "Asia/Jakarta" }).format(new Date())}
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik toko">
        {stats.map(({ label, value, helper, icon: Icon, color }) => (
          <article key={label} className="surface flex min-w-0 items-start gap-4 p-5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={23} weight="fill" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-400">{label}</p>
              <p className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950" title={value}>{value}</p>
              <p className="mt-1 text-xs text-slate-400">{helper}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="surface min-w-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-black text-slate-950">Pesanan terbaru</h2>
              <p className="mt-1 text-xs text-slate-400">Lima transaksi terakhir yang masuk.</p>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-[#1746a2] hover:text-[#e21b2d]">Lihat semua <ArrowRight size={15} /></Link>
          </div>

          {latestOrdersResult.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <tr><th className="px-6 py-3">Order</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Tanggal</th><th className="px-6 py-3 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestOrdersResult.data.map((order) => (
                    <tr key={order.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4 font-black text-slate-900">{order.order_number}</td>
                      <td className="px-4 py-4 text-slate-600">{order.recipient_name}</td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-inset ${statusStyles[order.status] ?? "bg-slate-100 text-slate-600 ring-slate-500/10"}`}>{statusLabels[order.status] ?? order.status}</span></td>
                      <td className="px-4 py-4 text-xs text-slate-500">{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(order.created_at))}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(order.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
              <div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBagOpen size={25} /></span><p className="mt-3 text-sm font-bold text-slate-700">Belum ada pesanan</p><p className="mt-1 text-xs text-slate-400">Pesanan baru akan tampil di sini.</p></div>
            </div>
          )}
        </section>

        <aside className="surface h-fit p-5 sm:p-6">
          <h2 className="font-black text-slate-950">Aksi cepat</h2>
          <p className="mt-1 text-xs text-slate-400">Jalan pintas pekerjaan rutin.</p>
          <div className="mt-5 grid gap-2">
            {quickActions.map(({ href, label, helper, icon: Icon }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#e8efff] group-hover:text-[#1746a2]"><Icon size={19} weight="bold" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-black text-slate-800">{label}</span><span className="mt-0.5 block text-[10px] text-slate-400">{helper}</span></span>
                <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1746a2]" />
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
