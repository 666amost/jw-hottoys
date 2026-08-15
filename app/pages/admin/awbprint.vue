<script setup lang="ts">
import { PhDownloadSimple as Download, PhPrinter as Printer, PhX as X } from "@phosphor-icons/vue";
import { downloadShippingLabelsPdf } from "~/lib/awb-label-pdf";
import type { ShippingLabelItem, ShippingLabelOrder } from "~~/shared/shipping-label";
import { paginateLabelItemsByHeight, shippingLabelItemText } from "~~/shared/shipping-label";

definePageMeta({ layout: false, middleware: "admin" });

type PrintJobResponse = {
  job: { id: string; created_at: string; created_by_name: string };
  labels: ShippingLabelOrder[];
};
type LabelPage = {
  key: string;
  label: ShippingLabelOrder;
  items: ShippingLabelItem[];
  pageNumber: number;
  totalPages: number;
  continuation: boolean;
};

const FIRST_PAGE_ITEM_HEIGHT = 182;
const CONTINUATION_ITEM_HEIGHT = 292;
const route = useRoute();
const jobId = String(route.query.job_id || "");
const endpoint = `/api/admin/label-print-jobs/${encodeURIComponent(jobId || "missing")}`;
const { data, error, status } = await useFetch<PrintJobResponse>(endpoint);
const measurementRoot = ref<HTMLElement | null>(null);
const pages = ref<LabelPage[]>([]);
const assetsReady = ref(false);
const downloading = ref(false);
const actionError = ref<string | null>(null);

function preparePages() {
  if (!data.value?.labels.length || !measurementRoot.value) return;
  const nextPages: LabelPage[] = [];
  data.value.labels.forEach((label, labelIndex) => {
    const rowElements = Array.from(measurementRoot.value?.querySelectorAll<HTMLElement>(`[data-measure-label="${labelIndex}"] .shipping-item-row`) ?? []);
    const heights = rowElements.map(row => Math.ceil(row.getBoundingClientRect().height));
    const groups = paginateLabelItemsByHeight(label.items, heights, FIRST_PAGE_ITEM_HEIGHT, CONTINUATION_ITEM_HEIGHT);
    groups.forEach((items, pageIndex) => nextPages.push({
      key: `${label.id}-${pageIndex}`,
      label,
      items,
      pageNumber: pageIndex + 1,
      totalPages: groups.length,
      continuation: pageIndex > 0,
    }));
  });
  pages.value = nextPages;
}

async function waitForAssets() {
  await nextTick();
  const startedAt = Date.now();
  while (document.querySelectorAll(".print-pages .awb-qr-image").length < pages.value.length && Date.now() - startedAt < 5000) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const images = Array.from(document.querySelectorAll<HTMLImageElement>(".print-pages img"));
  await Promise.all(images.map(async (image) => {
    if (!image.complete) await new Promise<void>(resolve => {
      const done = () => resolve();
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
    if (typeof image.decode === "function") {
      try { await image.decode(); } catch { /* continue with the loaded fallback */ }
    }
  }));
  if (document.fonts?.ready) await document.fonts.ready;
  assetsReady.value = true;
}

function removeFirstTimeFlag() {
  const url = new URL(window.location.href);
  url.searchParams.delete("first_time");
  window.history.replaceState({}, "", url);
}

async function printAll() {
  if (!assetsReady.value) return;
  window.print();
}

function closeWindow() {
  window.close();
}

async function downloadPdf() {
  if (!assetsReady.value || downloading.value) return;
  downloading.value = true;
  actionError.value = null;
  try {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".print-pages .shipping-label-page"));
    await downloadShippingLabelsPdf(elements, `jwlab-awb-${data.value?.job.id || jobId}.pdf`);
  } catch (downloadError) {
    actionError.value = downloadError instanceof Error ? downloadError.message : "PDF belum berhasil dibuat.";
  } finally {
    downloading.value = false;
  }
}

onMounted(async () => {
  if (!data.value?.labels.length) return;
  await nextTick();
  preparePages();
  await waitForAssets();
  if (route.query.first_time === "1") {
    removeFirstTimeFlag();
    setTimeout(() => window.print(), 350);
  }
});

const errorMessage = computed(() => {
  const value = error.value as { data?: { error?: { message?: string }; message?: string } } | null;
  return value?.data?.error?.message || value?.data?.message || "Print job tidak ditemukan atau tidak dapat dibuka.";
});

useSeoMeta({ title: "Print Label AWB" });
</script>

<template>
  <main class="awb-print-page min-h-screen bg-slate-100 text-slate-950">
    <header v-if="data" class="print-toolbar sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xl">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-base font-black sm:text-lg">Print Label Pengiriman</h1>
          <p class="mt-0.5 text-xs text-slate-500">{{ data.labels.length }} order · {{ pages.length }} halaman thermal 100×150</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b4697] px-4 text-xs font-black text-white disabled:opacity-50" :disabled="!assetsReady" @click="printAll">
            <Printer :size="17" weight="fill" /> Print Semua
          </button>
          <button type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 disabled:opacity-50" :disabled="!assetsReady || downloading" @click="downloadPdf">
            <Download :size="17" weight="bold" /> {{ downloading ? "Membuat PDF..." : "Download PDF" }}
          </button>
          <button type="button" class="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-700" @click="closeWindow">
            <X :size="17" weight="bold" /> Tutup
          </button>
        </div>
      </div>
      <p v-if="actionError" role="alert" class="mx-auto mt-3 max-w-5xl rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{{ actionError }}</p>
    </header>

    <section v-if="status === 'pending'" class="grid min-h-screen place-items-center p-6 text-center">
      <div><span class="mx-auto block size-9 animate-spin rounded-full border-4 border-slate-300 border-t-[#0b4697]" /><p class="mt-4 text-sm font-bold">Menyiapkan data label...</p></div>
    </section>

    <section v-else-if="error || !data" class="grid min-h-screen place-items-center p-6 text-center">
      <div class="max-w-md rounded-2xl bg-white p-8 shadow-sm"><h1 class="text-xl font-black text-red-700">Label tidak tersedia</h1><p class="mt-3 text-sm text-slate-600">{{ errorMessage }}</p><button class="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white" @click="closeWindow">Tutup</button></div>
    </section>

    <template v-else>
      <div v-if="!pages.length" ref="measurementRoot" class="label-measurement" aria-hidden="true">
        <div v-for="(label, labelIndex) in data.labels" :key="label.id" :data-measure-label="labelIndex" class="label-measure-list">
          <div v-for="(item, itemIndex) in label.items" :key="`${item.sku}-${itemIndex}`" class="shipping-item-row">{{ shippingLabelItemText(item) }}</div>
        </div>
      </div>

      <section class="print-pages py-5">
        <div v-for="page in pages" :key="page.key" class="print-page-shell">
          <ShippingLabel :label="page.label" :items="page.items" :page-number="page.pageNumber" :total-pages="page.totalPages" :continuation="page.continuation" />
        </div>
      </section>
    </template>
  </main>
</template>

<style>
html:has(.awb-print-page), body:has(.awb-print-page) { margin: 0; background: #f1f5f9; }
.label-measurement { position: fixed; left: -10000px; top: 0; width: 374px; visibility: hidden; pointer-events: none; }
.label-measure-list { width: 374px; }
.print-page-shell { width: 378px; height: 567px; margin: 0 auto 20px; background: #fff; box-shadow: 0 12px 35px rgba(15,23,42,.14); }
@page { size: 100mm 150mm; margin: 0; }
@media print {
  html, body, #__nuxt, .awb-print-page { width: 100%; margin: 0 !important; padding: 0 !important; background: #fff !important; }
  .print-toolbar, .label-measurement { display: none !important; }
  .print-pages { padding: 0 !important; }
  .print-page-shell { width: 100mm; height: 150mm; margin: 0 !important; break-after: page; page-break-after: always; box-shadow: none !important; overflow: hidden; }
  .print-page-shell:last-child { break-after: auto; page-break-after: auto; }
  .shipping-label-page { width: 100mm !important; height: 150mm !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
</style>
