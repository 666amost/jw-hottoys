<script setup lang="ts">
import { PhArrowUpRight as ArrowUpRight } from "@phosphor-icons/vue";
import { formatCurrency } from "~~/shared/format";
import type { Product } from "~~/shared/types";

const props = defineProps<{ product: Product }>();
const availableStock = computed(() => props.product.variant.stockOnHand - props.product.variant.reservedStock);
const discount = computed(() => {
  const sale = props.product.variant.salePrice;
  if (!sale || sale >= props.product.variant.regularPrice) return 0;
  return Math.round((1 - sale / props.product.variant.regularPrice) * 100);
});
</script>

<template>
  <article class="product-card group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-[0_20px_50px_rgba(7,26,61,.12)]">
    <NuxtLink :to="`/products/${product.slug}`" class="relative block aspect-square overflow-hidden bg-[#f2f3f5]">
      <img :src="product.images[0]" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]">
      <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#0b4697] shadow-sm backdrop-blur">{{ product.category.name }}</span>
      <span v-if="discount" class="absolute right-3 top-3 rounded-full bg-[#ec0016] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">-{{ discount }}%</span>
      <span class="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-[#071a3d] text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight :size="17" weight="bold" /></span>
    </NuxtLink>

    <div class="flex flex-1 flex-col p-4 sm:p-5">
      <NuxtLink :to="`/products/${product.slug}`" class="line-clamp-2 text-base font-black leading-snug text-slate-950 sm:text-lg">{{ product.name }}</NuxtLink>
      <p class="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500 sm:text-sm">{{ product.shortDescription }}</p>
      <div class="mt-4 flex min-h-11 items-end justify-between gap-2">
        <div class="min-w-0">
          <strong class="block truncate text-base font-black text-slate-950 sm:text-lg">{{ formatCurrency(product.variant.salePrice ?? product.variant.regularPrice) }}</strong>
          <del v-if="product.variant.salePrice" class="block text-[10px] text-slate-400">{{ formatCurrency(product.variant.regularPrice) }}</del>
        </div>
        <span class="shrink-0 text-[10px] font-bold" :class="availableStock > 0 ? 'text-emerald-600' : 'text-red-600'">{{ availableStock > 0 ? `${availableStock} tersedia` : "Habis" }}</span>
      </div>
      <div class="mt-4"><AddToCart :product="product" compact /></div>
    </div>
  </article>
</template>
