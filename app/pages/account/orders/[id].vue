<script setup lang="ts">
import { buildBceTrackingUrl } from "~~/shared/bce-integration";
import { formatCurrency, formatDate } from "~~/shared/format";
import { getOrderDisplayStatus, paymentStatusLabel, shipmentStatusLabel } from "~~/shared/order-display-status";

definePageMeta({ middleware: "auth" });
const route = useRoute();
const config = useRuntimeConfig();
const { data } = await useFetch(`/api/account/orders/${route.params.id}`);
if (!data.value) throw createError({ statusCode: 404, statusMessage: "Pesanan tidak ditemukan" });

type OrderDetail = {
  order_number: string;
  status: string;
  payment_status: string;
  shipment_status: string | null;
  awb_number: string | null;
  payment_url: string | null;
  total_amount: number;
};

const order = computed(() => data.value?.order as unknown as OrderDetail | undefined);
const displayStatus = computed(() => getOrderDisplayStatus({
  orderStatus: order.value?.status,
  paymentStatus: order.value?.payment_status,
  shipmentStatus: order.value?.shipment_status,
}));

const statusStyles: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700",
  payment_review: "bg-amber-50 text-amber-700",
  payment_failed: "bg-red-50 text-red-700",
  payment_expired: "bg-slate-100 text-slate-600",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-violet-50 text-violet-700",
  pending_awb: "bg-blue-50 text-blue-700",
  awb_created: "bg-indigo-50 text-indigo-700",
  picked_up: "bg-violet-50 text-violet-700",
  in_transit: "bg-violet-50 text-violet-700",
  fulfilled: "bg-emerald-50 text-emerald-700",
  exception: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const trackingUrl = computed(() => {
  const awb = String((data.value?.order as { awb_number?: string | null } | undefined)?.awb_number || "");
  return buildBceTrackingUrl(String(config.public.bceTrackingUrl || ""), awb);
});

useSeoMeta({ title: () => String((data.value?.order as { order_number?: string } | undefined)?.order_number || "Detail Pesanan") });
</script>

<template>
  <section class="container-shell py-12">
    <p class="eyebrow">Order detail</p>
    <h1 class="section-title mt-3">{{ order?.order_number }}</h1>
    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div class="grid gap-3">
        <article v-for="item in data?.items" :key="(item as any).id" class="surface flex justify-between p-5">
          <div>
            <b>{{ (item as any).product_name }}</b>
            <p class="text-sm text-slate-500">{{ (item as any).variant_name }} · {{ (item as any).quantity }} pcs</p>
          </div>
          <b>{{ formatCurrency((item as any).line_total) }}</b>
        </article>
        <section v-if="data?.shipmentEvents?.length" class="surface p-6">
          <h2 class="font-black">Perjalanan paket</h2>
          <div class="mt-4 grid gap-4">
            <div v-for="event in data.shipmentEvents" :key="(event as any).id" class="border-l-2 border-[#0b4697] pl-4">
              <b class="text-sm">{{ shipmentStatusLabel((event as any).status) }}</b>
              <p class="text-xs text-slate-500">{{ (event as any).note }} · {{ formatDate((event as any).occurred_at) }}</p>
            </div>
          </div>
        </section>
      </div>
      <aside class="surface h-fit p-6">
        <p class="text-sm text-slate-500">Status</p>
        <span class="mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-black" :class="statusStyles[displayStatus.key]">
          {{ displayStatus.label }}
        </span>
        <p class="mt-2 text-sm text-slate-500">{{ displayStatus.detail }}</p>
        <p v-if="order?.shipment_status" class="mt-4 text-xs text-slate-500"><b>Pembayaran:</b> {{ paymentStatusLabel(order.payment_status) }}</p>
        <p class="mt-5 text-sm text-slate-500">Total</p>
        <p class="mt-1 text-2xl font-black">{{ formatCurrency(Number(order?.total_amount || 0)) }}</p>
        <p v-if="order?.awb_number" class="mt-5 break-all text-sm"><b>AWB BCE:</b> {{ order.awb_number }}</p>
        <a
          v-if="trackingUrl"
          :href="trackingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 block text-sm font-black text-[#0b4697] underline"
        >
          Lacak di BCE Express
        </a>
        <a
          v-if="order?.payment_url && order.payment_status === 'pending'"
          :href="order.payment_url"
          class="mt-6 block rounded-full bg-[#0b4697] px-5 py-3 text-center font-black text-white"
        >
          Lanjut pembayaran
        </a>
      </aside>
    </div>
  </section>
</template>
