<script setup lang="ts">
const route = useRoute(); const { data } = await useFetch("/api/catalog");
const category = computed(() => data.value?.categories.find((item) => item.slug === route.params.slug));
const products = computed(() => data.value?.products.filter((product) => product.category.slug === route.params.slug) || []);
if (!category.value) throw createError({ statusCode: 404, statusMessage: "Kategori tidak ditemukan" });
useSeoMeta({ title: () => category.value?.name || "Kategori" });
</script>
<template><section class="container-shell py-12"><p class="eyebrow">Collection</p><h1 class="section-title mt-3">{{ category?.name }}</h1><p class="mt-4 max-w-2xl text-slate-500">{{ category?.description }}</p><div v-if="products.length" class="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><ProductCard v-for="product in products" :key="product.id" :product="product"/></div><div v-else class="surface mt-9 p-10 text-center"><h2 class="text-xl font-black">Koleksi ini masih kosong</h2><p class="mt-2 text-sm text-slate-500">Figure robot untuk kategori ini sedang disiapkan.</p></div></section></template>
