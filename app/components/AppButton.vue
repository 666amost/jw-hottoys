<script setup lang="ts">
import { Primitive } from "reka-ui";
withDefaults(defineProps<{ type?: "button" | "submit"; disabled?: boolean; variant?: "primary" | "secondary" | "danger" }>(), { type: "button", variant: "primary" });
</script>
<template>
  <Primitive as="button" :type="type" :disabled="disabled" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50" :class="variant === 'primary' ? 'bg-[#0b4697] text-white hover:bg-[#073979]' : variant === 'danger' ? 'bg-[#ec0016] text-white hover:bg-[#c90013]' : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'">
    <slot />
  </Primitive>
</template>
