<script setup lang="ts">
import { PhArrowClockwise as ArrowClockwise, PhPackage as Package } from "@phosphor-icons/vue";
import { formatCurrency, formatDate } from "~~/shared/format";
import { canRetryBceShipment, getOrderDisplayStatus, shipmentStatusLabel } from "~~/shared/order-display-status";

definePageMeta({ layout: "admin", middleware: "admin" });

type AdminOrder = {
  id: string;
  order_number: string;
  recipient_name: string;
  payment_status: string;
  status: string;
  shipment_status: string | null;
  shipment_error: string | null;
  awb_number: string | null;
  total_amount: number;
  created_at: string;
};

const { data, refresh } = await useFetch("/api/admin/orders");
const orders = computed(() => (data.value?.orders ?? []) as unknown as AdminOrder[]);
const busyOrderId = ref<string | null>(null);
const actionError = ref<string | null>(null);

const statusStyles: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700 ring-amber-600/10",
  payment_review: "bg-amber-50 text-amber-700 ring-amber-600/10",
  payment_failed: "bg-red-50 text-red-700 ring-red-600/10",
  payment_expired: "bg-slate-100 text-slate-600 ring-slate-500/10",
  paid: "bg-blue-50 text-blue-700 ring-blue-600/10",
  processing: "bg-violet-50 text-violet-700 ring-violet-600/10",
  pending_awb: "bg-blue-50 text-blue-700 ring-blue-600/10",
  awb_created: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  picked_up: "bg-violet-50 text-violet-700 ring-violet-600/10",
  in_transit: "bg-violet-50 text-violet-700 ring-violet-600/10",
  fulfilled: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  exception: "bg-red-50 text-red-700 ring-red-600/10",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

function displayStatus(order: AdminOrder) {
  return getOrderDisplayStatus({ orderStatus: order.status, paymentStatus: order.payment_status, shipmentStatus: order.shipment_status });
}

function mayRetry(order: AdminOrder) {
  return canRetryBceShipment({ paymentStatus: order.payment_status, awbNumber: order.awb_number, shipmentError: order.shipment_error });
}

function errorText(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return "Aksi belum berhasil. Silakan coba kembali.";
}

async function setStatus(id: string, status: string) {
  busyOrderId.value = id;
  actionError.value = null;
  try {
    await $fetch(`/api/admin/orders/${id}/status`, { method: "PATCH", body: { status, note: "Diperbarui admin" } });
    await refresh();
  } catch (error) {
    actionError.value = errorText(error);
  } finally {
    busyOrderId.value = null;
  }
}

async function retry(id: string) {
  busyOrderId.value = id;
  actionError.value = null;
  try {
    await $fetch(`/api/admin/shipments/${id}/retry`, { method: "POST" });
    await refresh();
  } catch (error) {
    actionError.value = errorText(error);
  } finally {
    busyOrderId.value = null;
  }
}

useSeoMeta({ title: "Admin Pesanan" });
</script>

<template>
  <div>
    <AdminPageHeader title="Pesanan" description="Pantau pembayaran, pembuatan resi, dan perjalanan setiap pesanan." />

    <p v-if="actionError" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {{ actionError }}
    </p>

    <div v-if="orders.length" class="grid gap-4">
      <article v-for="order in orders" :key="order.id" class="surface min-w-0 overflow-hidden p-5 sm:p-6">
        <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="break-words text-base font-black text-slate-950">{{ order.order_number }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ order.recipient_name }} · {{ formatDate(order.created_at) }}</p>
          </div>
          <p class="shrink-0 text-lg font-black text-slate-950">{{ formatCurrency(order.total_amount) }}</p>
        </div>

        <div class="mt-5 grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-end">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 ring-inset"
                :class="statusStyles[displayStatus(order).key] ?? 'bg-slate-100 text-slate-600 ring-slate-500/10'"
              >
                {{ displayStatus(order).label }}
              </span>
              <span class="text-xs text-slate-500">{{ displayStatus(order).detail }}</span>
            </div>

            <div class="mt-4 flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3.5">
              <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#0b4697] shadow-sm"><Package :size="18" weight="fill" /></span>
              <div class="min-w-0">
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pengiriman BCE</p>
                <p class="mt-1 text-xs font-bold text-slate-700">{{ shipmentStatusLabel(order.shipment_status) }}</p>
                <p v-if="order.awb_number" class="mt-1 break-all font-mono text-[11px] text-slate-500">AWB {{ order.awb_number }}</p>
                <p v-else-if="order.payment_status === 'paid' && !order.shipment_error" class="mt-1 text-[11px] text-slate-500">Resi sedang dibuat otomatis.</p>
                <p v-else-if="order.payment_status !== 'paid'" class="mt-1 text-[11px] text-slate-500">Pengiriman dibuat setelah pembayaran terverifikasi.</p>
                <p v-if="order.shipment_error" class="mt-2 text-[11px] font-semibold text-red-600">{{ order.shipment_error }}</p>
              </div>
            </div>
          </div>

          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1">
            <label class="min-w-0">
              <span class="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status pesanan</span>
              <select class="field w-full" :value="order.status" :disabled="busyOrderId === order.id" @change="setStatus(order.id, ($event.target as HTMLSelectElement).value)">
                <option v-if="order.status === 'awaiting_payment'" value="awaiting_payment" disabled>Menunggu pembayaran</option>
                <option value="paid">Sudah dibayar</option>
                <option value="processing">Sedang diproses</option>
                <option value="fulfilled">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>
            <AppButton v-if="mayRetry(order)" variant="secondary" class="self-end whitespace-nowrap" :disabled="busyOrderId === order.id" @click="retry(order.id)">
              <ArrowClockwise :size="17" :class="busyOrderId === order.id ? 'animate-spin' : ''" />
              {{ busyOrderId === order.id ? "Menjadwalkan..." : "Coba lagi buat resi" }}
            </AppButton>
          </div>
        </div>
      </article>
    </div>

    <section v-else class="surface grid min-h-64 place-items-center p-8 text-center">
      <div>
        <span class="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Package :size="24" /></span>
        <p class="mt-3 text-sm font-black text-slate-700">Belum ada pesanan</p>
        <p class="mt-1 text-xs text-slate-400">Pesanan baru akan muncul di halaman ini.</p>
      </div>
    </section>
  </div>
</template>
