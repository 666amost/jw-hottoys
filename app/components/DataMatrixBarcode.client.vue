<script setup lang="ts">
import { createDataMatrixArtwork } from "~/lib/data-matrix";

const props = defineProps<{ value?: string | null }>();
const artwork = computed(() => {
  try {
    return createDataMatrixArtwork(props.value);
  } catch {
    return null;
  }
});
</script>

<template>
  <svg
    v-if="artwork"
    class="data-matrix-code"
    :viewBox="`0 0 ${artwork.totalWidth} ${artwork.totalHeight}`"
    role="img"
    :aria-label="`Data Matrix AWB ${artwork.normalizedValue}`"
    shape-rendering="crispEdges"
    preserveAspectRatio="xMidYMid meet"
  >
    <rect :width="artwork.totalWidth" :height="artwork.totalHeight" fill="#fff" />
    <path :d="artwork.path" fill="#000" />
  </svg>
</template>
