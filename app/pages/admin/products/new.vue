<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

const { data } = await useFetch("/api/admin/products");

async function saved(id: string) {
  await navigateTo(`/admin/products/${id}/edit`);
}

useSeoMeta({ title: "Produk Baru" });
</script>

<template>
  <div>
    <AdminPageHeader
      title="Produk baru"
      description="Lengkapi informasi katalog, varian, harga, gambar, dan status publikasi produk."
    />
    <ProductForm :categories="data?.categories || []" @saved="saved" />
  </div>
</template>
