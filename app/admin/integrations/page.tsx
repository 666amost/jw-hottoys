import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { retryShipment } from "../actions";

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const { data: failed } = await supabase.from("shipments").select("id,order_id,error_message,retry_count,orders(order_number)").not("error_message", "is", null).order("updated_at", { ascending: false });
  const configured = Boolean(env.bceApiUrl && env.bcePartnerKey && env.bceWebhookSecret);
  return <div><p className="eyebrow">BCE Express</p><h1 className="mt-2 text-3xl font-black">Status integrasi</h1><div className={`surface mt-7 flex items-center gap-4 p-6 ${configured ? "text-emerald-700" : "text-amber-700"}`}>{configured ? <CheckCircle size={30} weight="fill" /> : <WarningCircle size={30} weight="fill" />}<div><p className="font-black">{configured ? "Konfigurasi BCE lengkap" : "Konfigurasi BCE belum lengkap"}</p><p className="mt-1 text-xs opacity-75">Agent server-controlled: JWLAB-STUDIO · billing: agent_flat · total: shipping_charged_amount</p></div></div><h2 className="mt-9 text-xl font-black">Shipment perlu retry</h2><div className="mt-4 grid gap-3">{failed?.map((shipment) => { const orderRelation = shipment.orders as unknown as { order_number?: string } | Array<{ order_number?: string }> | null; const order = Array.isArray(orderRelation) ? orderRelation[0] : orderRelation; return <div key={shipment.id} className="surface flex flex-wrap items-center gap-4 p-5"><div className="flex-1"><p className="font-bold">{order?.order_number}</p><p className="mt-1 text-xs text-red-600">{shipment.error_message} · percobaan {shipment.retry_count}</p></div><form action={retryShipment}><input type="hidden" name="order_id" value={shipment.order_id} /><Button size="sm" variant="secondary">Masukkan queue lagi</Button></form></div>; })}{!failed?.length && <div className="surface p-8 text-sm text-slate-500">Tidak ada kegagalan aktif.</div>}</div></div>;
}
