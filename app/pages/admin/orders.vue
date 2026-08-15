<script setup lang="ts">
import {
  PhArrowClockwise as ArrowClockwise,
  PhCheckCircle as CheckCircle,
  PhPackage as Package,
  PhPrinter as Printer,
} from "@phosphor-icons/vue";
import { formatCurrency, formatDate } from "~~/shared/format";
import { getFulfillmentBucket } from "~~/shared/order-fulfillment-bucket";
import { canRetryBceShipment, getOrderDisplayStatus, shipmentStatusLabel } from "~~/shared/order-display-status";

definePageMeta({ layout: "admin", middleware: "admin" });

type OrderBucket = "all" | "needs_processing" | "processed";
type AdminOrder = {
  id: string;
  order_number: string;
  recipient_name: string;
  payment_status: string;
  status: string;
  shipment_status: string | null;
  shipment_error: string | null;
  awb_number: string | null;
  label_printed_at: string | null;
  total_amount: number;
  created_at: string;
};

const route = useRoute();
const router = useRouter();
const validBuckets = new Set<OrderBucket>(["all", "needs_processing", "processed"]);
const bucket = computed<OrderBucket>(() => {
  const requested = String(route.query.bucket || "all") as OrderBucket;
  return validBuckets.has(requested) ? requested : "all";
});
const { data, refresh, status } = await useFetch("/api/admin/orders", {
  query: computed(() => ({ bucket: bucket.value })),
  watch: [bucket],
});
const orders = computed(() => (data.value?.orders ?? []) as unknown as AdminOrder[]);
const selectedIds = ref<string[]>([]);
const busyOrderId = ref<string | null>(null);
const printing = ref(false);
const printingOrderId = ref<string | null>(null);
const actionError = ref<string | null>(null);

const tabs = computed(() => [
  { key: "needs_processing" as const, label: "Perlu diproses", count: data.value?.counts.needsProcessing ?? 0 },
  { key: "processed" as const, label: "Sudah diproses", count: data.value?.counts.processed ?? 0 },
  { key: "all" as const, label: "Semua pesanan", count: null },
]);
const printableOrders = computed(() => orders.value.filter(isPrintable));
const allPrintableSelected = computed(() => printableOrders.value.length > 0
  && printableOrders.value.every(order => selectedIds.value.includes(order.id)));
const selectedOrders = computed(() => orders.value.filter(order => selectedIds.value.includes(order.id)));
const isReprint = computed(() => selectedOrders.value.length > 0
  && selectedOrders.value.every(order => Boolean(order.label_printed_at)));

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

function isPrintable(order: AdminOrder) {
  return getFulfillmentBucket({
    paymentStatus: order.payment_status,
    orderStatus: order.status,
    shipmentStatus: order.shipment_status,
    awbNumber: order.awb_number,
    labelPrintedAt: order.label_printed_at,
  }) !== null;
}

function mayRetry(order: AdminOrder) {
  return canRetryBceShipment({ paymentStatus: order.payment_status, awbNumber: order.awb_number, shipmentError: order.shipment_error });
}

function errorText(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string; error?: { message?: string } } }).data;
    if (data?.error?.message) return data.error.message;
    if (data?.message) return data.message;
  }
  return "Aksi belum berhasil. Silakan coba kembali.";
}

function bucketQuery(nextBucket: OrderBucket) {
  return nextBucket === "all" ? {} : { bucket: nextBucket };
}

async function setBucket(nextBucket: OrderBucket) {
  selectedIds.value = [];
  actionError.value = null;
  await router.push({ path: "/admin/orders", query: bucketQuery(nextBucket) });
}

function toggleOrder(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(selectedId => selectedId !== id)
    : [...selectedIds.value, id];
}

function toggleAll() {
  const visibleIds = printableOrders.value.map(order => order.id);
  selectedIds.value = allPrintableSelected.value
    ? selectedIds.value.filter(id => !visibleIds.includes(id))
    : [...new Set([...selectedIds.value, ...visibleIds])];
}

async function setStatus(id: string, nextStatus: string) {
  busyOrderId.value = id;
  actionError.value = null;
  try {
    await $fetch(`/api/admin/orders/${id}/status`, { method: "PATCH", body: { status: nextStatus, note: "Diperbarui admin" } });
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id);
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

async function openPrintJob(orderIds: string[], directOrderId: string | null = null) {
  if (!orderIds.length || printing.value) return;
  const printWindow = window.open("about:blank", "_blank");
  if (printWindow) {
    printWindow.document.title = "Menyiapkan label JWLAB";
    printWindow.document.body.innerHTML = "<p style='font:600 14px Arial;padding:24px'>Menyiapkan label pengiriman...</p>";
  }
  printing.value = true;
  printingOrderId.value = directOrderId;
  actionError.value = null;
  try {
    const result = await $fetch<{ printUrl: string }>("/api/admin/label-print-jobs", {
      method: "POST",
      body: { orderIds },
    });
    selectedIds.value = selectedIds.value.filter(id => !orderIds.includes(id));
    await refresh();
    if (printWindow) printWindow.location.href = result.printUrl;
    else window.location.assign(result.printUrl);
  } catch (error) {
    printWindow?.close();
    actionError.value = errorText(error);
    await refresh();
  } finally {
    printing.value = false;
    printingOrderId.value = null;
  }
}

async function createPrintJob() {
  await openPrintJob([...selectedIds.value]);
}

async function reprintOrder(order: AdminOrder) {
  if (!order.label_printed_at || !isPrintable(order)) return;
  await openPrintJob([order.id], order.id);
}

watch(orders, () => {
  const availableIds = new Set(printableOrders.value.map(order => order.id));
  selectedIds.value = selectedIds.value.filter(id => availableIds.has(id));
});

useSeoMeta({ title: "Admin Pesanan" });
</script>

<template>
  <div class="pb-24">
    <AdminPageHeader title="Pesanan" description="Proses order ber-AWB, cetak label, dan pantau perjalanan BCE Express." />

    <nav class="mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Filter pemrosesan pesanan">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-black transition"
        :class="bucket === tab.key ? 'border-[#0b4697] bg-[#0b4697] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'"
        :aria-current="bucket === tab.key ? 'page' : undefined"
        @click="setBucket(tab.key)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== null" class="rounded-full px-2 py-0.5 text-[10px]" :class="bucket === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'">{{ tab.count }}</span>
      </button>
    </nav>

    <p v-if="actionError" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {{ actionError }}
    </p>

    <section v-if="orders.length" class="surface mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
      <label class="flex cursor-pointer items-center gap-3 text-sm font-black text-slate-800">
        <input type="checkbox" class="size-5 accent-[#0b4697]" :checked="allPrintableSelected" :disabled="!printableOrders.length" @change="toggleAll">
        Pilih semua yang dapat dicetak
      </label>
      <p class="text-xs font-semibold text-slate-500">{{ selectedIds.length }} dipilih · {{ printableOrders.length }} siap dicetak</p>
    </section>

    <div v-if="orders.length" class="grid gap-4" :aria-busy="status === 'pending'">
      <article v-for="order in orders" :key="order.id" class="surface min-w-0 overflow-hidden p-5 sm:p-6" :class="selectedIds.includes(order.id) ? 'ring-2 ring-[#0b4697]/30' : ''">
        <div class="flex min-w-0 items-start gap-3">
          <input
            v-if="isPrintable(order)"
            type="checkbox"
            class="mt-1 size-5 shrink-0 cursor-pointer accent-[#0b4697]"
            :checked="selectedIds.includes(order.id)"
            :aria-label="`Pilih pesanan ${order.order_number}`"
            @change="toggleOrder(order.id)"
          >
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="break-words text-base font-black text-slate-950">{{ order.order_number }}</p>
                  <span v-if="order.label_printed_at" class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                    <CheckCircle :size="14" weight="fill" /> Label tercetak
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ order.recipient_name }} · {{ formatDate(order.created_at) }}</p>
              </div>
              <p class="shrink-0 text-lg font-black text-slate-950">{{ formatCurrency(order.total_amount) }}</p>
            </div>

            <div class="mt-5 grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-end">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold ring-1 ring-inset" :class="statusStyles[displayStatus(order).key] ?? 'bg-slate-100 text-slate-600 ring-slate-500/10'">
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
                <AppButton
                  v-if="bucket === 'processed' && order.label_printed_at && isPrintable(order)"
                  variant="secondary"
                  class="self-end whitespace-nowrap"
                  :disabled="printing"
                  @click="reprintOrder(order)"
                >
                  <Printer :size="17" weight="fill" />
                  {{ printingOrderId === order.id ? "Menyiapkan..." : "Print AWB lagi" }}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <section v-else class="surface grid min-h-64 place-items-center p-8 text-center">
      <div>
        <span class="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Package :size="24" /></span>
        <p class="mt-3 text-sm font-black text-slate-700">{{ bucket === 'needs_processing' ? 'Tidak ada label yang perlu dicetak' : bucket === 'processed' ? 'Belum ada pesanan yang diproses' : 'Belum ada pesanan' }}</p>
        <p class="mt-1 text-xs text-slate-400">Daftar akan diperbarui otomatis setelah status pesanan berubah.</p>
      </div>
    </section>

    <div v-if="selectedIds.length" class="fixed inset-x-4 bottom-4 z-30 md:left-[304px] lg:right-8">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:px-5">
        <p class="min-w-0 text-xs font-bold text-slate-600"><b class="text-slate-950">{{ selectedIds.length }}</b> pesanan dipilih</p>
        <AppButton :disabled="printing" class="shrink-0" @click="createPrintJob">
          <Printer :size="18" weight="fill" />
          {{ printing ? "Menyiapkan..." : isReprint ? `Cetak ulang (${selectedIds.length})` : `Print label (${selectedIds.length})` }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
