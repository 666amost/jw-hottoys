<script setup lang="ts">
import { formatCurrency, formatDate } from "~~/shared/format";
import { getOrderDisplayStatus } from "~~/shared/order-display-status";

definePageMeta({ middleware: "auth" });

type AccountOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  shipment_status: string | null;
  shipping_provider: "BCE" | "JNE" | null;
  shipping_service: string | null;
  total_amount: number;
  item_count: number;
  created_at: string;
};

const { data } = await useFetch("/api/account/orders");
const orders = computed(() => (data.value?.orders ?? []) as unknown as AccountOrder[]);

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

function displayStatus(order: AccountOrder) {
  return getOrderDisplayStatus({ orderStatus: order.status, paymentStatus: order.payment_status, shipmentStatus: order.shipment_status });
}

useSeoMeta({ title: "Pesanan Saya" });
</script>

<template>
  <section class="container-shell py-12">
    <p class="eyebrow">My account</p>
    <h1 class="section-title mt-3">Pesanan</h1>
    <div class="mt-8 grid gap-3">
      <NuxtLink
        v-for="order in orders"
        :key="order.id"
        :to="`/account/orders/${order.id}`"
        class="surface grid min-w-0 gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      >
        <div class="min-w-0">
          <b class="break-words">{{ order.order_number }}</b>
          <p class="mt-1 text-xs text-slate-500">{{ formatDate(order.created_at) }} · {{ order.item_count }} item</p>
          <p v-if="order.shipping_provider" class="mt-1 text-xs font-bold text-[#0b4697]">{{ order.shipping_service || order.shipping_provider }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="rounded-full px-2.5 py-1 text-[10px] font-extrabold" :class="statusStyles[displayStatus(order).key]">
              {{ displayStatus(order).label }}
            </span>
            <span class="text-xs text-slate-400">{{ displayStatus(order).detail }}</span>
          </div>
        </div>
        <b class="shrink-0 sm:text-right">{{ formatCurrency(order.total_amount) }}</b>
      </NuxtLink>
    </div>
  </section>
</template>
