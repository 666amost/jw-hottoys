<script setup lang="ts">
import {
  PhArrowLeft as ArrowLeft,
  PhCheckCircle as CheckCircle,
  PhStorefront as Storefront,
  PhX as X,
} from "@phosphor-icons/vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const route = useRoute();
const { data, refresh } = await useFetch("/api/admin/products");
const product = computed(() => data.value?.products.find((item) => item.id === route.params.id));
const savedVisible = ref(false);

if (!product.value) throw createError({ statusCode: 404, statusMessage: "Produk tidak ditemukan" });

async function saved() {
  await refresh();
  savedVisible.value = true;
  await nextTick();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

useSeoMeta({ title: "Edit Produk" });
</script>

<template>
  <div>
    <AdminPageHeader
      :title="`Edit ${product?.name}`"
      description="Perbarui informasi produk. Penyesuaian jumlah stok dilakukan dari halaman Inventory."
    />
    <section
      v-if="savedVisible"
      role="status"
      aria-live="polite"
      class="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm sm:flex-row sm:items-center"
    >
      <span class="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle :size="24" weight="fill" /></span>
      <div class="min-w-0 flex-1">
        <h2 class="font-black">Perubahan produk berhasil disimpan</h2>
        <p class="mt-1 text-sm leading-6 text-emerald-800">Informasi katalog, harga, gambar, dan status publikasi sudah diperbarui. Stok tetap dikelola melalui Inventory.</p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <NuxtLink to="/admin/products" class="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 text-xs font-black text-emerald-900"><ArrowLeft :size="15" /> Daftar produk</NuxtLink>
        <NuxtLink v-if="product?.published" :to="`/products/${product.slug}`" target="_blank" class="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-black text-white"><Storefront :size="16" /> Lihat di toko</NuxtLink>
        <button type="button" class="grid size-10 place-items-center rounded-full text-emerald-800 hover:bg-emerald-100" aria-label="Tutup notifikasi" @click="savedVisible = false"><X :size="18" /></button>
      </div>
    </section>
    <ProductForm v-if="product" :product="product" :categories="data?.categories || []" @saved="saved" />
  </div>
</template>
