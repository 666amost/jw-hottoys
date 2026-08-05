import { Package, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,payment_status,total_amount,created_at,order_items(quantity),shipments(awb_number,status)")
    .order("created_at", { ascending: false });

  return (
    <section className="container-shell py-10 sm:py-14">
      <p className="eyebrow">Akun saya</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Pesanan</h1>
      <div className="mt-7 grid gap-4">
        {orders?.map((order) => {
          const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
          const itemCount = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);
          return (
            <Link href={`/account/orders/${order.id}`} key={order.id} className="surface flex flex-wrap items-center gap-5 p-6 transition hover:border-[#1746a2]/40">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#e8efff] text-[#1746a2]"><Package size={24} /></div>
              <div className="min-w-48 flex-1">
                <p className="font-black">{order.order_number}</p>
                <p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(order.created_at))} · {itemCount} item</p>
              </div>
              <div><p className="text-xs font-bold uppercase text-[#e21b2d]">{shipment?.awb_number ? shipment.status : order.payment_status}</p><p className="mt-1 font-black">{formatCurrency(order.total_amount)}</p></div>
              <ArrowRight size={20} className="text-slate-400" />
            </Link>
          );
        })}
        {!orders?.length && <div className="surface p-12 text-center text-sm text-slate-500">Belum ada pesanan.</div>}
      </div>
    </section>
  );
}
