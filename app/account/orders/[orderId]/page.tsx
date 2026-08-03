import { CheckCircle, Circle, Package, Truck } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*,order_items(*),payments(payment_url,status,expires_at),shipments(id,awb_number,status,tracking_url,shipment_events(status,location,note,occurred_at))")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) notFound();

  const shipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
  const events = [...(shipment?.shipment_events ?? [])].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );

  return (
    <section className="container-shell py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Detail pesanan</p><h1 className="mt-2 text-3xl font-black">{order.order_number}</h1></div>
        <span className="rounded-full bg-[#eaf2f4] px-4 py-2 text-xs font-bold uppercase text-[#0d5772]">{order.payment_status} · {order.status}</span>
      </div>
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <section className="surface overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5"><h2 className="font-black">Produk</h2></div>
            <div className="divide-y divide-slate-100">
              {order.order_items.map((item: { id: string; product_name: string; variant_name: string; sku: string; quantity: number; unit_price: number }) => (
                <div key={item.id} className="flex justify-between gap-4 p-6 text-sm">
                  <div><p className="font-bold">{item.product_name}</p><p className="mt-1 text-xs text-slate-500">{item.variant_name} · {item.sku} · {item.quantity}x</p></div>
                  <p className="font-black">{formatCurrency(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="surface p-6">
            <div className="flex items-center gap-3"><Truck size={24} className="text-[#0d5772]" /><div><h2 className="font-black">Tracking BCE Express</h2><p className="text-xs text-slate-500">{shipment?.awb_number ?? "Menunggu pembuatan AWB"}</p></div></div>
            <div className="mt-6 grid gap-5">
              {events.map((event, index) => (
                <div key={`${event.occurred_at}-${index}`} className="flex gap-4">
                  {index === 0 ? <CheckCircle size={22} weight="fill" className="shrink-0 text-[#0d5772]" /> : <Circle size={22} className="shrink-0 text-slate-300" />}
                  <div><p className="text-sm font-bold capitalize">{event.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-slate-500">{event.location}{event.note ? ` · ${event.note}` : ""}</p><time className="mt-1 block text-[10px] text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurred_at))}</time></div>
                </div>
              ))}
              {!events.length && <p className="text-sm text-slate-500">Timeline akan muncul setelah resi dibuat.</p>}
            </div>
          </section>
        </div>
        <aside className="surface p-6">
          <h2 className="font-black">Rincian biaya</h2>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Voucher produk</dt><dd>-{formatCurrency(order.product_discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Referensi ongkir</dt><dd className={order.shipping_discount_amount > 0 ? "line-through text-slate-400" : ""}>{formatCurrency(order.shipping_reference_amount)}</dd></div>
            {order.shipping_discount_amount > 0 && <div className="flex justify-between text-emerald-600"><dt>Promo ongkir</dt><dd>-{formatCurrency(order.shipping_discount_amount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-slate-500">Ongkir dibayar</dt><dd className="font-bold">{formatCurrency(order.shipping_charged_amount)}</dd></div>
          </dl>
          <div className="my-5 border-t border-dashed" />
          <div className="flex justify-between"><dt className="font-bold">Total</dt><dd className="text-xl font-black">{formatCurrency(order.total_amount)}</dd></div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500"><Package size={19} className="mb-2 text-[#0d5772]" />Dikirim ke {order.recipient_name}, {order.shipping_destination_code}. Detail alamat lengkap hanya terlihat oleh pemilik order dan admin.</div>
        </aside>
      </div>
    </section>
  );
}
