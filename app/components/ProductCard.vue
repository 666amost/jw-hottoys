<script setup lang="ts">
import type { Product } from "~~/shared/types";
import { formatCurrency } from "~~/shared/format";
defineProps<{ product: Product }>();
</script>
<template>
  <article class="surface group overflow-hidden">
    <NuxtLink :to="`/products/${product.slug}`" class="block aspect-square overflow-hidden bg-slate-100"><img :src="product.images[0]" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"></NuxtLink>
    <div class="p-5"><p class="eyebrow">{{ product.category.name }}</p><NuxtLink :to="`/products/${product.slug}`" class="mt-2 block text-lg font-black leading-tight">{{ product.name }}</NuxtLink><p class="mt-2 line-clamp-2 text-sm text-slate-500">{{ product.shortDescription }}</p>
      <div class="mt-4 flex items-end gap-2"><strong class="text-lg">{{ formatCurrency(product.variant.salePrice ?? product.variant.regularPrice) }}</strong><del v-if="product.variant.salePrice" class="text-xs text-slate-400">{{ formatCurrency(product.variant.regularPrice) }}</del></div>
    </div>
  </article>
</template>
