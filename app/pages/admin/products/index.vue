<script setup lang="ts">
import { formatCurrency } from "~~/shared/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const { data, refresh } = await useFetch("/api/admin/products");
const category = reactive({ name: "", slug: "", description: "" });
const categoryError = ref("");
const categoryLoading = ref(false);

function slugify() {
  category.slug = category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function createCategory() {
  categoryLoading.value = true;
  categoryError.value = "";
  try {
    await $fetch("/api/admin/categories", { method: "POST", body: category });
    Object.assign(category, { name: "", slug: "", description: "" });
    await refresh();
  } catch (cause: any) {
    categoryError.value = cause?.data?.error?.message || cause?.data?.statusMessage || "Kategori gagal dibuat.";
  } finally {
    categoryLoading.value = false;
  }
}

useSeoMeta({ title: "Admin Produk" });
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <AdminPageHeader title="Produk" />
      <NuxtLink
        v-if="data?.categories.length"
        to="/admin/products/new"
        class="rounded-full bg-[#0b4697] px-5 py-3 text-sm font-black text-white"
      >
        Produk baru
      </NuxtLink>
    </div>

    <section class="surface p-6">
      <div class="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <p class="eyebrow">Kategori katalog</p>
          <h2 class="mt-2 text-xl font-black">Buat kategori figure robot</h2>
          <p class="mt-2 text-sm leading-6 text-slate-500">Minimal satu kategori diperlukan sebelum produk pertama dapat dibuat.</p>
          <div v-if="data?.categories.length" class="mt-4 flex flex-wrap gap-2">
            <span v-for="item in data.categories" :key="item.id" class="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold">{{ item.name }}</span>
          </div>
          <p v-else class="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">Belum ada kategori.</p>
        </div>
        <form class="grid gap-4" @submit.prevent="createCategory">
          <label class="field-label">Nama kategori<input v-model="category.name" class="field" required @input="slugify"></label>
          <label class="field-label">Slug<input v-model="category.slug" class="field" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"></label>
          <label class="field-label">Deskripsi<textarea v-model="category.description" class="field min-h-24" maxlength="500" /></label>
          <p v-if="categoryError" class="text-sm font-bold text-red-600">{{ categoryError }}</p>
          <div><AppButton type="submit" :disabled="categoryLoading">{{ categoryLoading ? "Menyimpan..." : "Buat kategori" }}</AppButton></div>
        </form>
      </div>
    </section>

    <div v-if="data?.products.length" class="surface overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50"><tr><th class="p-4">Produk</th><th class="p-4">SKU</th><th class="p-4">Harga</th><th class="p-4">Stok</th><th class="p-4" /></tr></thead>
        <tbody><tr v-for="product in data.products" :key="product.id" class="border-t"><td class="p-4"><b>{{ product.name }}</b><small class="block text-slate-500">{{ product.published ? "Published" : "Draft" }}</small></td><td class="p-4">{{ product.variant.sku }}</td><td class="p-4">{{ formatCurrency(product.variant.salePrice ?? product.variant.regularPrice) }}</td><td class="p-4">{{ product.variant.stockOnHand-product.variant.reservedStock }}</td><td class="p-4"><NuxtLink :to="`/admin/products/${product.id}/edit`" class="font-bold text-[#0b4697]">Edit</NuxtLink></td></tr></tbody>
      </table>
    </div>
    <div v-else class="surface p-8 text-center">
      <h2 class="text-xl font-black">Belum ada produk</h2>
      <p class="mt-2 text-sm text-slate-500">Buat kategori di atas, lalu tambahkan figure robot pertama JWLAB STUDIO.</p>
    </div>
  </div>
</template>
