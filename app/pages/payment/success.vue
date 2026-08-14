<script setup lang="ts">
import {
  PhCircleNotch as CircleNotch,
  PhClock as Clock,
  PhWarningCircle as WarningCircle,
} from "@phosphor-icons/vue";
import { buildBceTrackingUrl } from "~~/shared/bce-integration";
import {
  getNextPaymentStatusPollDelay,
  getPaymentMonitoringDecision,
  QRIS_MONITORING_WINDOW_MS,
  type PaymentStatusData,
} from "~~/shared/payment-status-monitoring";

const route = useRoute();
const config = useRuntimeConfig();
const order = String(route.query.order || "");
const status = ref<PaymentStatusData | null>(null);
const ended = ref(false);
const failed = ref(false);
const { clear } = useCart();
let timer: ReturnType<typeof setTimeout> | undefined;
let awbDeadline: number | null = null;
let cartCleared = false;

const terminal = computed(() => status.value && status.value.payment_status !== "pending");
const trackingUrl = computed(() => status.value?.awb_number
  ? buildBceTrackingUrl(String(config.public.bceTrackingUrl || ""), status.value.awb_number)
  : null);
const statusMessage = computed(() => {
  if (status.value?.payment_status === "paid") {
    if (status.value.awb_number) return `Pembayaran berhasil. Resi BCE: ${status.value.awb_number}`;
    if (ended.value) return "Pembayaran berhasil. Resi masih diproses dan akan tersedia di detail pesanan.";
    return "Pembayaran berhasil, resi sedang dibuat.";
  }
  if (failed.value) return "Status belum dapat diperbarui. Kami akan mencoba lagi.";
  return "Halaman ini diperbarui otomatis selama maksimal 30 menit.";
});

async function monitor() {
  const started = Date.now();
  let deadline = started + QRIS_MONITORING_WINDOW_MS;

  async function check() {
    try {
      const current = await $fetch<PaymentStatusData>(`/api/orders/${encodeURIComponent(order)}/payment-status`);
      status.value = current;
      failed.value = false;

      if (current.payment_status === "paid" && !cartCleared) {
        clear();
        cartCleared = true;
      }

      const decision = getPaymentMonitoringDecision(Date.now(), started, current, awbDeadline);
      awbDeadline = decision.awbDeadline;
      if (!decision.shouldPoll || decision.deadline === null) return;
      deadline = decision.deadline;
    } catch {
      failed.value = true;
    }

    const delay = getNextPaymentStatusPollDelay(Date.now(), deadline, started);
    if (delay === null) {
      ended.value = true;
      return;
    }
    timer = setTimeout(check, delay);
  }

  await check();
}

onMounted(() => void monitor());
onUnmounted(() => timer && clearTimeout(timer));
useSeoMeta({ title: "Status Pembayaran" });
</script>

<template>
  <section class="container-shell py-16">
    <div class="surface mx-auto max-w-xl p-8 text-center">
      <QrisSuccessAnimation v-if="status?.payment_status === 'paid'" />
      <WarningCircle v-else-if="terminal" :size="64" weight="fill" class="mx-auto text-amber-500" />
      <Clock v-else-if="ended" :size="64" class="mx-auto text-[#0b4697]" />
      <CircleNotch v-else :size="64" class="mx-auto animate-spin text-[#0b4697]" />
      <p class="eyebrow mt-6">{{ status?.order_number || order }}</p>
      <h1 class="mt-3 text-3xl font-black">
        {{ status?.payment_status === 'paid' ? 'Order diterima' : terminal ? 'Pembayaran tidak selesai' : ended ? 'Waktu QRIS selesai' : 'Mengonfirmasi pembayaran' }}
      </h1>
      <p class="mt-3 text-sm leading-6 text-slate-500">{{ statusMessage }}</p>
      <a
        v-if="trackingUrl"
        :href="trackingUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-5 block text-sm font-black text-[#0b4697] underline"
      >
        Lacak di BCE Express
      </a>
      <NuxtLink
        :to="status?.id ? `/account/orders/${status.id}` : '/account/orders'"
        class="mt-7 inline-block rounded-full bg-[#0b4697] px-6 py-3 text-sm font-black text-white"
      >
        Lihat detail pesanan
      </NuxtLink>
    </div>
  </section>
</template>
