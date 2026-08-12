<script setup lang="ts">
import { formatCurrency } from "~~/shared/format";
const route = useRoute(); const { data } = await useFetch("/api/catalog");
const product = computed(() => data.value?.products.find((item) => item.slug === route.params.slug));
if (!product.value) throw createError({ statusCode: 404, statusMessage: "Produk tidak ditemukan" });
useSeoMeta({ title: () => product.value?.name || "Produk", description: () => product.value?.shortDescription });
</script>
<template><section v-if="product" class="container-shell grid gap-10 py-12 lg:grid-cols-2"><div class="surface overflow-hidden bg-slate-100"><img :src="product.images[0]" :alt="product.name" class="aspect-square h-full w-full object-cover"></div><div class="self-center"><p class="eyebrow">{{ product.category.name }}</p><h1 class="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{{ product.name }}</h1><p class="mt-5 text-lg leading-8 text-slate-600">{{ product.description }}</p><div class="mt-7 flex items-baseline gap-3"><strong class="text-3xl">{{ formatCurrency(product.variant.salePrice ?? product.variant.regularPrice) }}</strong><del v-if="product.variant.salePrice" class="text-slate-400">{{ formatCurrency(product.variant.regularPrice) }}</del></div><div class="mt-5 grid gap-2 rounded-2xl bg-white p-5 text-sm"><span><b>Varian:</b> {{ product.variant.name }}</span><span><b>SKU:</b> {{ product.variant.sku }}</span><span><b>Stok tersedia:</b> {{ product.variant.stockOnHand - product.variant.reservedStock }}</span></div><div class="mt-7"><AddToCart :product="product"/></div></div></section></template>
