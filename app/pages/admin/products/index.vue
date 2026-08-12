<script setup lang="ts">
import {
  PhCheckCircle as CheckCircle,
  PhPencilSimple as PencilSimple,
  PhStorefront as Storefront,
  PhX as X,
} from "@phosphor-icons/vue";
import { formatCurrency } from "~~/shared/format";

definePageMeta({ layout: "admin", middleware: "admin" });
const route = useRoute();
const router = useRouter();
const { data, refresh } = await useFetch("/api/admin/products");
const category = reactive({ name: "", slug: "", description: "" });
const categoryError = ref("");
const categoryLoading = ref(false);
const createdId = computed(() => typeof route.query.created === "string" ? route.query.created : "");
const createdProduct = computed(() => data.value?.products.find((product) => product.id === createdId.value));

async function dismissCreated() {
  const query = { ...route.query };
  delete query.created;
  await router.replace({ query });
}

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

    <section
      v-if="createdId"
      role="status"
      aria-live="polite"
      class="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm sm:flex-row sm:items-center"
    >
      <span class="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><CheckCircle :size="27" weight="fill" /></span>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Upload selesai</p>
        <h2 class="mt-1 text-lg font-black">{{ createdProduct?.name || "Produk baru" }} berhasil dibuat</h2>
        <p class="mt-1 text-sm leading-6 text-emerald-800">Gambar sudah tersimpan di R2 dan data produk sudah masuk ke katalog{{ createdProduct?.published ? " publik" : " sebagai draft" }}.</p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <NuxtLink v-if="createdProduct" :to="`/admin/products/${createdProduct.id}/edit`" class="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 text-xs font-black text-emerald-900"><PencilSimple :size="16" /> Edit produk</NuxtLink>
        <NuxtLink v-if="createdProduct?.published" :to="`/products/${createdProduct.slug}`" target="_blank" class="inline-flex min-h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 text-xs font-black text-white"><Storefront :size="16" /> Lihat di toko</NuxtLink>
        <button type="button" class="grid size-10 place-items-center rounded-full text-emerald-800 hover:bg-emerald-100" aria-label="Tutup notifikasi" @click="dismissCreated"><X :size="18" /></button>
      </div>
    </section>

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
