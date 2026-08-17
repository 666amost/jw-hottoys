<script setup lang="ts">
import {
  PhArrowRight as ArrowRight,
  PhMegaphone as Megaphone,
  PhPackage as Package,
  PhPlus as Plus,
  PhShoppingBagOpen as ShoppingBagOpen,
  PhWarning as Warning,
} from "@phosphor-icons/vue";
import { formatCurrency, formatDate } from "~~/shared/format";
import { getOrderDisplayStatus } from "~~/shared/order-display-status";

definePageMeta({ layout: "admin", middleware: "admin" });

type DashboardOrder = {
  id: string;
  order_number: string;
  recipient_name: string;
  payment_status: string;
  status: string;
  shipment_status: string | null;
  awb_number: string | null;
  total_amount: number;
  created_at: string;
  label_printed_at: string | null;
  shipping_provider: "BCE" | "JNE" | null;
  shipping_service: string | null;
};

const { data } = await useFetch("/api/admin/overview");
const orders = computed(() => (data.value?.recentOrders ?? []) as unknown as DashboardOrder[]);
const today = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "full",
  timeZone: "Asia/Jakarta",
}).format(new Date());

const stats = computed(() => [
  {
    label: "Total pesanan",
    value: String(data.value?.metrics.orders ?? 0),
    helper: "Semua pesanan masuk",
    icon: ShoppingBagOpen,
    iconText: null,
    color: "bg-blue-50 text-[#0b4697]",
  },
  {
    label: "Produk",
    value: String(data.value?.metrics.products ?? 0),
    helper: "Produk dalam katalog",
    icon: Package,
    iconText: null,
    color: "bg-violet-50 text-violet-700",
  },
  {
    label: "Pendapatan terbayar",
    value: formatCurrency(data.value?.metrics.revenue ?? 0),
    helper: "Pembayaran terkonfirmasi",
    icon: null,
    iconText: "Rp",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Stok menipis",
    value: String(data.value?.metrics.lowStock ?? 0),
    helper: "Varian dengan stok ≤ 5",
    icon: Warning,
    iconText: null,
    color: "bg-amber-50 text-amber-700",
  },
]);

const quickActions = [
  { href: "/admin/products/new", label: "Tambah produk baru", helper: "Buat produk dan varian", icon: Plus },
  { href: "/admin/inventory", label: "Perbarui inventory", helper: "Atur stok yang tersedia", icon: Package },
  { href: "/admin/content", label: "Kelola billboard", helper: "Ubah informasi di website", icon: Megaphone },
];

const statusStyles: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700 ring-amber-600/10",
  payment_review: "bg-amber-50 text-amber-700 ring-amber-600/10",
  payment_failed: "bg-red-50 text-red-700 ring-red-600/10",
  payment_expired: "bg-slate-100 text-slate-600 ring-slate-500/10",
  paid: "bg-blue-50 text-blue-700 ring-blue-600/10",
  pending_awb: "bg-blue-50 text-blue-700 ring-blue-600/10",
  awb_created: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  picked_up: "bg-violet-50 text-violet-700 ring-violet-600/10",
  in_transit: "bg-violet-50 text-violet-700 ring-violet-600/10",
  processing: "bg-violet-50 text-violet-700 ring-violet-600/10",
  fulfilled: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  exception: "bg-red-50 text-red-700 ring-red-600/10",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/10",
};

function orderStatus(order: DashboardOrder) {
  return getOrderDisplayStatus({
    orderStatus: order.status,
    paymentStatus: order.payment_status,
    shipmentStatus: order.shipment_status,
  });
}

useSeoMeta({ title: "Admin Dashboard" });
</script>

<template>
  <div>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <AdminPageHeader
        eyebrow="Ringkasan hari ini"
        title="Dashboard toko"
        description="Pantau operasional dan kelola JWLAB STUDIO dari satu tempat."
        compact
      />
      <p class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
        {{ today }}
      </p>
    </div>

    <section class="mt-6 grid gap-3 lg:grid-cols-2" aria-label="Antrean pemrosesan pesanan">
      <NuxtLink
        to="/admin/orders?bucket=needs_processing"
        class="group surface flex min-w-0 items-center gap-3 border-l-4 border-l-amber-500 p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:px-5"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-extrabold uppercase tracking-[.1em] text-amber-700">Pesanan perlu diproses</span>
          <span class="mt-1 block text-xs text-slate-500">Label BCE belum dicetak atau resi JNE belum dimasukkan.</span>
        </span>
        <strong class="shrink-0 text-3xl font-black tracking-tight text-slate-950">{{ data?.metrics.needsProcessing ?? 0 }}</strong>
        <ArrowRight :size="21" class="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-600" />
      </NuxtLink>

      <NuxtLink
        to="/admin/orders?bucket=processed"
        class="group surface flex min-w-0 items-center gap-3 border-l-4 border-l-emerald-500 p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:px-5"
      >
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-extrabold uppercase tracking-[.1em] text-emerald-700">Pesanan sudah diproses</span>
          <span class="mt-1 block text-xs text-slate-500">Label BCE sudah dicetak atau resi JNE sudah tersimpan.</span>
        </span>
        <strong class="shrink-0 text-3xl font-black tracking-tight text-slate-950">{{ data?.metrics.processed ?? 0 }}</strong>
        <ArrowRight :size="21" class="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" />
      </NuxtLink>
    </section>

    <section class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistik toko">
      <article v-for="stat in stats" :key="stat.label" class="surface flex min-w-0 items-start gap-4 p-5">
        <span class="grid size-11 shrink-0 place-items-center rounded-xl" :class="stat.color">
          <component :is="stat.icon" v-if="stat.icon" :size="23" weight="fill" />
          <span v-else class="text-sm font-black tracking-tight">{{ stat.iconText }}</span>
        </span>
        <div class="min-w-0">
          <p class="text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-400">{{ stat.label }}</p>
          <p class="mt-1 truncate text-2xl font-black tracking-tight text-slate-950" :title="stat.value">{{ stat.value }}</p>
          <p class="mt-1 text-xs text-slate-400">{{ stat.helper }}</p>
        </div>
      </article>
    </section>

    <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="surface min-w-0 overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 class="font-black text-slate-950">Pesanan terbaru</h2>
            <p class="mt-1 text-xs text-slate-400">Transaksi terakhir yang masuk.</p>
          </div>
          <NuxtLink to="/admin/orders" class="flex items-center gap-1 text-xs font-bold text-[#0b4697] hover:text-[#ec0016]">
            Lihat semua <ArrowRight :size="15" />
          </NuxtLink>
        </div>

        <div v-if="orders.length" class="divide-y divide-slate-100">
          <article
            v-for="order in orders"
            :key="order.id"
            class="grid min-w-0 gap-3 px-5 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
          >
            <div class="min-w-0">
              <p class="break-words text-sm font-black text-slate-900">{{ order.order_number }}</p>
              <p class="mt-1 truncate text-xs text-slate-500" :title="order.recipient_name">{{ order.recipient_name }} · {{ formatDate(order.created_at) }}</p>
              <p v-if="order.shipping_provider" class="mt-1 text-[11px] font-bold text-[#0b4697]">{{ order.shipping_service || order.shipping_provider }}</p>
              <div class="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-inset"
                  :class="statusStyles[orderStatus(order).key] ?? 'bg-slate-100 text-slate-600 ring-slate-500/10'"
                >
                  {{ orderStatus(order).label }}
                </span>
                <span class="min-w-0 truncate text-[11px] text-slate-400">{{ orderStatus(order).detail }}</span>
              </div>
            </div>
            <p class="shrink-0 text-sm font-black text-slate-950 sm:text-right">{{ formatCurrency(order.total_amount) }}</p>
          </article>
        </div>
        <div v-else class="grid min-h-56 place-items-center px-6 py-10 text-center">
          <div>
            <span class="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><ShoppingBagOpen :size="25" /></span>
            <p class="mt-3 text-sm font-bold text-slate-700">Belum ada pesanan</p>
            <p class="mt-1 text-xs text-slate-400">Pesanan baru akan tampil di sini.</p>
          </div>
        </div>
      </section>

      <aside class="surface h-fit p-5 sm:p-6">
        <h2 class="font-black text-slate-950">Aksi cepat</h2>
        <p class="mt-1 text-xs text-slate-400">Jalan pintas pekerjaan rutin.</p>
        <div class="mt-5 grid gap-2">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.href"
            :to="action.href"
            class="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-[#e8efff] group-hover:text-[#0b4697]">
              <component :is="action.icon" :size="19" weight="bold" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-black text-slate-800">{{ action.label }}</span>
              <span class="mt-0.5 block text-[10px] text-slate-400">{{ action.helper }}</span>
            </span>
            <ArrowRight :size="16" class="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0b4697]" />
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>
