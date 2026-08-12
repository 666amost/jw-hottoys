<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
  compact?: boolean;
}>();
</script>

<template>
  <header :class="compact ? 'mb-0' : 'mb-7'">
    <p class="eyebrow">{{ eyebrow || "JWLAB admin" }}</p>
    <h1 class="mt-2 text-3xl font-black tracking-tight">{{ title }}</h1>
    <p v-if="description" class="mt-2 text-sm text-slate-500">{{ description }}</p>
  </header>
</template>
