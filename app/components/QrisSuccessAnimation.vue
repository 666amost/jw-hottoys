<script setup lang="ts">
import animationData from "~~/lib/animations/qris-success.json";

const element = ref<HTMLElement>();
let animation: { destroy: () => void } | undefined;
onMounted(async () => {
  const lottie = (await import("lottie-web/build/player/lottie_light")).default;
  if (!element.value) return;
  animation = lottie.loadAnimation({ container: element.value, renderer: "svg", loop: false, autoplay: true, animationData });
});
onBeforeUnmount(() => animation?.destroy());
</script>
<template><div ref="element" class="mx-auto h-24 w-24" aria-label="Pembayaran berhasil" /></template>
