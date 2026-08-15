<script setup lang="ts">
import QRCode from "qrcode";
import { normalizeAwbForBarcode } from "~~/shared/shipping-label";

const props = defineProps<{ value?: string | null }>();
const dataUrl = ref<string | null>(null);

watch(() => props.value, async (value) => {
  const normalized = normalizeAwbForBarcode(value);
  if (!normalized) {
    dataUrl.value = null;
    return;
  }
  try {
    dataUrl.value = await QRCode.toDataURL(normalized, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    dataUrl.value = null;
  }
}, { immediate: true });
</script>

<template>
  <img v-if="dataUrl" :src="dataUrl" :alt="`QR AWB ${normalizeAwbForBarcode(value)}`" class="awb-qr-image">
</template>
