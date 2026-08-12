<script setup lang="ts">
import {
  PhCheckCircle as CheckCircle,
  PhImage as ImageIcon,
  PhInfo as Info,
  PhPackage as Package,
  PhTag as Tag,
  PhUploadSimple as UploadSimple,
} from "@phosphor-icons/vue";
import type { Category, Product } from "~~/shared/types";

const props = defineProps<{ product?: Product; categories: Category[] }>();
const emit = defineEmits<{ saved: [id: string] }>();

const loading = ref(false);
const imageProcessing = ref(false);
const error = ref("");
const image = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const slugEdited = ref(Boolean(props.product?.slug));

const form = reactive({
  categoryId: props.product?.category.id || props.categories[0]?.id || "",
  name: props.product?.name || "",
  slug: props.product?.slug || "",
  shortDescription: props.product?.shortDescription || "",
  description: props.product?.description || "",
  sku: props.product?.variant.sku || "",
  variantName: props.product?.variant.name || "",
  regularPrice: props.product?.variant.regularPrice || 0,
  salePrice: props.product?.variant.salePrice ?? "",
  stock: props.product?.variant.stockOnHand || 0,
  weight: props.product?.variant.shippingWeightGrams || 600,
  published: props.product?.published ?? true,
  featured: props.product?.featured ?? false,
});

const displayedImage = computed(() => previewUrl.value || props.product?.images[0] || "");
const submitLabel = computed(() => props.product ? "Simpan perubahan" : "Simpan produk");

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function syncSlug() {
  if (!props.product && !slugEdited.value) form.slug = slugify(form.name);
}

async function webp(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!blob || blob.size > 3_500_000) throw new Error("Gambar hasil optimasi melebihi 3,5 MB.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
}

async function pick(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  error.value = "";
  imageProcessing.value = true;
  try {
    const optimized = await webp(file);
    image.value = optimized;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = URL.createObjectURL(optimized);
  } catch (cause) {
    image.value = null;
    input.value = "";
    error.value = cause instanceof Error ? cause.message : "Gambar gagal diproses.";
  } finally {
    imageProcessing.value = false;
  }
}

async function save() {
  if (loading.value || imageProcessing.value) return;
  if (!props.categories.length) {
    error.value = "Buat minimal satu kategori sebelum menyimpan produk.";
    return;
  }
  if (!props.product && !image.value) {
    error.value = "Pilih satu gambar utama sebelum menyimpan produk.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const body = new FormData();
    for (const [key, value] of Object.entries(form)) body.set(key, String(value));
    if (image.value) body.set("image", image.value);
    const path = props.product ? `/api/admin/products/${props.product.id}` : "/api/admin/products";
    const result = await $fetch<{ id?: string }>(path, { method: props.product ? "PATCH" : "POST", body });
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
    image.value = null;
    emit("saved", result.id || props.product!.id);
  } catch (cause: any) {
    error.value = cause?.data?.error?.message || cause?.data?.statusMessage || "Produk gagal disimpan.";
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<template>
  <div v-if="!categories.length" class="surface p-8 text-center">
    <span class="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Info :size="24" weight="fill" /></span>
    <h2 class="mt-4 text-xl font-black">Kategori diperlukan</h2>
    <p class="mt-2 text-sm text-slate-500">Buat kategori figure robot sebelum menambahkan produk.</p>
    <NuxtLink to="/admin/products" class="mt-5 inline-block rounded-full bg-[#0b4697] px-5 py-3 text-sm font-black text-white">Kelola kategori</NuxtLink>
  </div>

  <form v-else class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" @submit.prevent="save">
    <div class="grid min-w-0 gap-6">
      <section class="surface overflow-hidden" aria-labelledby="product-identity-title">
        <header class="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0b4697]"><Package :size="20" weight="fill" /></span>
          <div>
            <h2 id="product-identity-title" class="font-black text-slate-950">Informasi produk</h2>
            <p class="mt-1 text-xs leading-5 text-slate-500">Nama dan deskripsi yang akan dilihat pelanggan di katalog.</p>
          </div>
        </header>

        <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <label class="field-label">
            <span>Nama produk <span class="text-red-600">*</span></span>
            <input
              v-model="form.name"
              class="field"
              required
              maxlength="120"
              placeholder="Contoh: JW-01 Astro Guardian"
              aria-describedby="product-name-help"
              @input="syncSlug"
            >
            <small id="product-name-help" class="field-helper">Gunakan nama lengkap yang mudah dicari pelanggan.</small>
          </label>

          <label class="field-label">
            <span>Kategori <span class="text-red-600">*</span></span>
            <select v-model="form.categoryId" class="field" required aria-describedby="product-category-help">
              <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
            <small id="product-category-help" class="field-helper">Menentukan kelompok produk pada katalog toko.</small>
          </label>

          <label class="field-label sm:col-span-2">
            <span>Slug URL <span class="text-red-600">*</span></span>
            <span class="relative block">
              <span class="field-prefix text-slate-400">/products/</span>
              <input
                v-model="form.slug"
                class="field field-with-long-prefix"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="jw-01-astro-guardian"
                aria-describedby="product-slug-help"
                @input="slugEdited = true"
              >
            </span>
            <small id="product-slug-help" class="field-helper">Terisi otomatis dari nama. Gunakan huruf kecil, angka, dan tanda hubung.</small>
          </label>

          <label class="field-label sm:col-span-2">
            <span class="flex items-center justify-between gap-3">
              <span>Deskripsi singkat</span>
              <span class="text-[10px] font-semibold text-slate-400">{{ form.shortDescription.length }}/180</span>
            </span>
            <input
              v-model="form.shortDescription"
              class="field"
              maxlength="180"
              placeholder="Contoh: Robot guardian edisi kolektor dengan artikulasi penuh."
              aria-describedby="product-short-description-help"
            >
            <small id="product-short-description-help" class="field-helper">Tampil pada kartu produk dan hasil pencarian.</small>
          </label>

          <label class="field-label sm:col-span-2">
            <span class="flex items-center justify-between gap-3">
              <span>Deskripsi lengkap</span>
              <span class="text-[10px] font-semibold text-slate-400">{{ form.description.length }}/4000</span>
            </span>
            <textarea
              v-model="form.description"
              class="field min-h-40 resize-y leading-6"
              maxlength="4000"
              placeholder="Jelaskan cerita karakter, material, ukuran, isi paket, dan detail penting lainnya."
              aria-describedby="product-description-help"
            />
            <small id="product-description-help" class="field-helper">Semakin lengkap informasinya, semakin mudah pelanggan mengambil keputusan.</small>
          </label>
        </div>
      </section>

      <section class="surface overflow-hidden" aria-labelledby="product-variant-title">
        <header class="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Tag :size="20" weight="fill" /></span>
          <div>
            <h2 id="product-variant-title" class="font-black text-slate-950">Varian, harga, dan pengiriman</h2>
            <p class="mt-1 text-xs leading-5 text-slate-500">Data internal untuk stok, transaksi, dan kalkulasi ongkir.</p>
          </div>
        </header>

        <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <label class="field-label">
            <span>SKU <span class="text-red-600">*</span></span>
            <input v-model="form.sku" class="field" required maxlength="80" placeholder="Contoh: JW-ASTRO-01" aria-describedby="product-sku-help">
            <small id="product-sku-help" class="field-helper">Kode unik internal untuk produk atau varian ini.</small>
          </label>

          <label class="field-label">
            <span>Nama varian <span class="text-red-600">*</span></span>
            <input v-model="form.variantName" class="field" required maxlength="100" placeholder="Contoh: Standard Edition" aria-describedby="product-variant-help">
            <small id="product-variant-help" class="field-helper">Contoh lain: Red Armor, Deluxe, atau 30 cm.</small>
          </label>

          <label class="field-label">
            <span>Harga reguler <span class="text-red-600">*</span></span>
            <span class="relative block">
              <span class="field-prefix text-slate-500">Rp</span>
              <input v-model.number="form.regularPrice" type="number" class="field field-with-prefix" required min="0" step="1" placeholder="750000" aria-describedby="product-price-help">
            </span>
            <small id="product-price-help" class="field-helper">Harga normal sebelum diskon, tanpa titik atau koma.</small>
          </label>

          <label class="field-label">
            <span class="flex items-center justify-between gap-3"><span>Harga sale</span><span class="text-[10px] font-semibold text-slate-400">Opsional</span></span>
            <span class="relative block">
              <span class="field-prefix text-slate-500">Rp</span>
              <input v-model.number="form.salePrice" type="number" class="field field-with-prefix" min="0" step="1" placeholder="650000" aria-describedby="product-sale-help">
            </span>
            <small id="product-sale-help" class="field-helper">Kosongkan jika produk tidak sedang mendapat harga promo.</small>
          </label>

          <label class="field-label">
            <span>Berat kirim <span class="text-red-600">*</span></span>
            <span class="relative block">
              <input v-model.number="form.weight" type="number" class="field field-with-suffix" required min="1" max="100000" step="1" placeholder="600" aria-describedby="product-weight-help">
              <span class="field-suffix text-slate-500">gram</span>
            </span>
            <small id="product-weight-help" class="field-helper">Gunakan berat produk setelah dikemas untuk perhitungan ongkir.</small>
          </label>

          <label v-if="!product" class="field-label">
            <span>Stok awal <span class="text-red-600">*</span></span>
            <span class="relative block">
              <input v-model.number="form.stock" type="number" class="field field-with-suffix" required min="0" step="1" placeholder="10" aria-describedby="product-stock-help">
              <span class="field-suffix text-slate-500">unit</span>
            </span>
            <small id="product-stock-help" class="field-helper">Jumlah barang siap jual saat produk dibuat.</small>
          </label>

          <div v-else class="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:self-end">
            <p class="flex items-center gap-2 text-xs font-bold text-blue-700"><Info :size="17" weight="fill" /> Perubahan stok</p>
            <p class="mt-1.5 text-xs leading-5 text-slate-500">Stok produk yang sudah ada diperbarui melalui menu Inventory agar riwayatnya tercatat.</p>
          </div>
        </div>
      </section>

      <section class="surface overflow-hidden" aria-labelledby="product-media-title">
        <header class="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ImageIcon :size="20" weight="fill" /></span>
          <div>
            <h2 id="product-media-title" class="font-black text-slate-950">Gambar produk</h2>
            <p class="mt-1 text-xs leading-5 text-slate-500">Gambar otomatis dioptimalkan ke WebP sebelum diunggah.</p>
          </div>
        </header>

        <div class="grid gap-5 p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-6">
          <div class="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <img v-if="displayedImage" :src="displayedImage" alt="Preview gambar produk" class="h-full w-full object-contain p-2">
            <div v-else class="text-center text-slate-400">
              <ImageIcon :size="34" class="mx-auto" />
              <p class="mt-2 text-[10px] font-bold uppercase tracking-wider">Belum ada gambar</p>
            </div>
          </div>

          <div class="min-w-0">
            <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="sr-only" @change="pick">
            <label
              for="product-image"
              class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6 text-center transition hover:border-[#0b4697] hover:bg-blue-50"
            >
              <span class="grid size-11 place-items-center rounded-xl bg-white text-[#0b4697] shadow-sm"><UploadSimple :size="22" weight="bold" /></span>
              <span class="mt-3 text-sm font-black text-slate-800">{{ product ? "Pilih gambar pengganti" : "Pilih gambar utama" }}</span>
              <span class="mt-1 text-xs text-slate-500">PNG, JPG, WebP, atau AVIF</span>
            </label>
            <div class="mt-3 flex min-w-0 items-center gap-2 text-xs">
              <CheckCircle v-if="image" :size="17" weight="fill" class="shrink-0 text-emerald-600" />
              <span v-if="imageProcessing" class="font-semibold text-slate-500">Mengoptimalkan gambar...</span>
              <span v-else-if="image" class="truncate font-semibold text-slate-700">{{ image.name }}</span>
              <span v-else class="text-slate-500">Maksimal hasil WebP 3,5 MB dan sisi terpanjang 1600 px.</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <aside class="grid gap-4 xl:sticky xl:top-24">
      <section class="surface p-5 sm:p-6" aria-labelledby="product-publication-title">
        <h2 id="product-publication-title" class="font-black text-slate-950">Publikasi</h2>
        <p class="mt-1 text-xs leading-5 text-slate-500">Atur visibilitas produk di storefront.</p>

        <div class="mt-5 grid gap-3">
          <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
            <span>
              <span class="block text-sm font-bold text-slate-800">Tampilkan produk</span>
              <span class="mt-1 block text-[11px] leading-4 text-slate-500">Produk dapat dilihat dan dibeli pelanggan.</span>
            </span>
            <span class="relative shrink-0">
              <input v-model="form.published" type="checkbox" class="peer sr-only">
              <span class="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#0b4697] after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
            </span>
          </label>

          <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-3.5">
            <span>
              <span class="block text-sm font-bold text-slate-800">Produk unggulan</span>
              <span class="mt-1 block text-[11px] leading-4 text-slate-500">Prioritaskan produk pada area pilihan toko.</span>
            </span>
            <span class="relative shrink-0">
              <input v-model="form.featured" type="checkbox" class="peer sr-only">
              <span class="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#ec0016] after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
            </span>
          </label>
        </div>
      </section>

      <section class="surface p-5 sm:p-6">
        <p class="text-xs leading-5 text-slate-500"><span class="font-black text-red-600">*</span> Menandakan field yang wajib diisi.</p>
        <p v-if="error" role="alert" aria-live="polite" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold leading-5 text-red-700">{{ error }}</p>
        <AppButton type="submit" class="mt-5 w-full" :disabled="loading || imageProcessing">
          {{ loading ? "Menyimpan..." : imageProcessing ? "Memproses gambar..." : submitLabel }}
        </AppButton>
        <NuxtLink to="/admin/products" class="mt-3 flex min-h-10 items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-900">Batal dan kembali</NuxtLink>
      </section>
    </aside>
  </form>
</template>
