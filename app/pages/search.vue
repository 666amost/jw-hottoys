<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const query = ref(String(route.query.q || ""));
const category = ref(String(route.query.category || ""));
const { data } = await useFetch("/api/catalog");
const products = computed(() => (data.value?.products || []).filter((product) =>
  (!query.value || `${product.name} ${product.shortDescription} ${product.variant.sku}`.toLowerCase().includes(query.value.toLowerCase()))
  && (!category.value || product.category.slug === category.value),
));
watch([query, category], () => router.replace({ query: { ...(query.value ? { q: query.value } : {}), ...(category.value ? { category: category.value } : {}) } }));
useSeoMeta({ title: "Cari Figure Robot" });
</script>

<template>
  <section class="container-shell py-12">
    <p class="eyebrow">Katalog JWLAB</p>
    <h1 class="section-title mt-3">Temukan figure robot favorit</h1>
    <div class="surface mt-8 grid gap-4 p-4 sm:grid-cols-[1fr_260px]">
      <input v-model="query" class="field" placeholder="Cari nama atau SKU...">
      <select v-model="category" class="field"><option value="">Semua kategori</option><option v-for="item in data?.categories" :key="item.id" :value="item.slug">{{ item.name }}</option></select>
    </div>
    <p class="mt-6 text-sm font-bold text-slate-500">{{ products.length }} produk ditemukan</p>
    <div v-if="products.length" class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><ProductCard v-for="product in products" :key="product.id" :product="product" /></div>
    <div v-else class="surface mt-6 p-10 text-center"><h2 class="text-xl font-black">Belum ada figure yang ditemukan</h2><p class="mt-2 text-sm text-slate-500">Koleksi baru akan muncul di sini setelah dipublikasikan oleh studio.</p></div>
  </section>
</template>
