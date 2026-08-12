<script setup lang="ts">
import {
  PhArrowLeft as ArrowLeft,
  PhCheck as Check,
  PhCheckCircle as CheckCircle,
  PhMapPin as MapPin,
  PhPackage as Package,
  PhPlus as Plus,
  PhQrCode as QrCode,
  PhShieldCheck as ShieldCheck,
  PhTicket as Ticket,
  PhTruck as Truck,
  PhWarningCircle as WarningCircle,
} from "@phosphor-icons/vue";
import { formatCurrency } from "~~/shared/format";
import { calculateCartShipping } from "~~/shared/shipping";

type AddressRow = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  address_line: string;
  landmark?: string | null;
  is_default: number | boolean;
};

definePageMeta({ middleware: "auth" });

const { lines, count, subtotal } = useCart();
const { data } = await useFetch<{ addresses: AddressRow[] }>("/api/account/addresses");
const addressId = ref("");
const voucherCode = ref("");
const loading = ref(false);
const error = ref("");
const shipping = computed(() => lines.value.length ? calculateCartShipping(lines.value) : null);
const total = computed(() => subtotal.value + (shipping.value?.chargedAmount || 0));

watchEffect(() => {
  if (!addressId.value && data.value?.addresses?.length) {
    addressId.value = data.value.addresses.find((address) => Boolean(address.is_default))?.id || data.value.addresses[0]!.id;
  }
});

async function checkout() {
  if (loading.value || !lines.value.length || !addressId.value) return;
  loading.value = true;
  error.value = "";
  try {
    const result = await $fetch<{ payment_url: string }>("/api/checkout", {
      method: "POST",
      body: {
        addressId: addressId.value,
        voucherCode: voucherCode.value.trim() || null,
        lines: lines.value.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
      },
    });
    window.location.assign(result.payment_url);
  } catch (cause: any) {
    error.value = cause?.data?.data?.error?.message || cause?.data?.statusMessage || "Checkout gagal diproses. Silakan periksa alamat dan coba lagi.";
    loading.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

useSeoMeta({
  title: "Checkout Aman",
  description: "Pilih alamat pengiriman dan selesaikan pembayaran pesanan JWLAB STUDIO melalui QRIS.",
});
</script>

<template>
  <main class="pb-24 sm:pb-16">
    <section class="border-b border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/50">
      <div class="container-shell py-8 sm:py-11">
        <NuxtLink to="/cart" class="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#0b4697]"><ArrowLeft :size="16" /> Kembali ke keranjang</NuxtLink>
        <div class="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="eyebrow">Secure checkout</p>
            <h1 class="section-title mt-2">Selesaikan pesanan</h1>
            <p class="mt-3 text-sm text-slate-500">Periksa tujuan pengiriman sebelum membuat pembayaran QRIS.</p>
          </div>
          <ol class="flex max-w-md items-center text-[10px] font-black uppercase tracking-[.08em] text-slate-400 sm:w-full" aria-label="Tahapan checkout">
            <li class="flex items-center gap-2 text-emerald-700"><span class="grid size-7 place-items-center rounded-full bg-emerald-600 text-white"><Check :size="14" weight="bold" /></span> Keranjang</li>
            <li class="mx-3 h-px flex-1 bg-emerald-300" />
            <li class="flex items-center gap-2 text-[#0b4697]"><span class="grid size-7 place-items-center rounded-full bg-[#0b4697] text-white">2</span> Pengiriman</li>
            <li class="mx-3 h-px flex-1 bg-slate-200" />
            <li class="flex items-center gap-2"><span class="grid size-7 place-items-center rounded-full border border-slate-300 bg-white">3</span> Bayar</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="container-shell py-7 sm:py-10">
      <div v-if="!lines.length" class="surface mx-auto max-w-2xl px-6 py-14 text-center">
        <Package :size="48" weight="duotone" class="mx-auto text-[#0b4697]" />
        <h2 class="mt-4 text-2xl font-black">Tidak ada produk untuk diproses</h2>
        <p class="mt-2 text-sm text-slate-500">Tambahkan produk ke keranjang sebelum membuka checkout.</p>
        <NuxtLink to="/search" class="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#0b4697] px-5 text-sm font-black text-white">Pilih produk</NuxtLink>
      </div>

      <div v-else class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:gap-8">
        <div class="grid min-w-0 gap-5">
          <div v-if="error" role="alert" aria-live="assertive" class="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <WarningCircle :size="23" weight="fill" class="shrink-0" />
            <div><p class="text-sm font-black">Checkout belum dapat dilanjutkan</p><p class="mt-1 text-xs leading-5">{{ error }}</p></div>
          </div>

          <section class="surface overflow-hidden" aria-labelledby="shipping-address-title">
            <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0b4697]"><MapPin :size="21" weight="fill" /></span>
                <div><p class="text-[9px] font-black uppercase tracking-[.14em] text-[#0b4697]">Langkah 1</p><h2 id="shipping-address-title" class="mt-0.5 text-lg font-black">Alamat pengiriman</h2></div>
              </div>
              <NuxtLink to="/account/addresses/new" class="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-[#0b4697] hover:text-[#0b4697]"><Plus :size="15" weight="bold" /> Alamat baru</NuxtLink>
            </header>

            <div v-if="data?.addresses?.length" class="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <label
                v-for="address in data.addresses"
                :key="address.id"
                class="relative cursor-pointer rounded-2xl border p-4 transition"
                :class="addressId === address.id ? 'border-[#0b4697] bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-slate-300'"
              >
                <input v-model="addressId" type="radio" :value="address.id" class="sr-only">
                <span v-if="addressId === address.id" class="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-[#0b4697] text-white"><Check :size="13" weight="bold" /></span>
                <span class="block pr-8 text-sm font-black">{{ address.label }} <span v-if="address.is_default" class="ml-1 rounded-full bg-emerald-100 px-2 py-1 text-[8px] uppercase tracking-wider text-emerald-700">Utama</span></span>
                <span class="mt-3 block text-sm font-bold text-slate-800">{{ address.recipient_name }}</span>
                <span class="mt-1 block text-xs text-slate-500">{{ address.phone }}</span>
                <span class="mt-3 block text-xs leading-5 text-slate-600">{{ address.address_line }}, {{ address.subdistrict }}, {{ address.district }}, {{ address.city }} {{ address.postal_code }}</span>
              </label>
            </div>

            <div v-else class="p-6 text-center sm:p-10">
              <span class="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><MapPin :size="27" weight="duotone" /></span>
              <h3 class="mt-4 font-black">Alamat pengiriman diperlukan</h3>
              <p class="mt-2 text-sm text-slate-500">Tambahkan alamat Jakarta atau Tangerang untuk menghitung dan memproses pengiriman.</p>
              <NuxtLink to="/account/addresses/new" class="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b4697] px-5 text-sm font-black text-white"><Plus :size="16" /> Tambah alamat</NuxtLink>
            </div>
          </section>

          <section class="surface overflow-hidden" aria-labelledby="voucher-title">
            <header class="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <span class="grid size-10 place-items-center rounded-xl bg-red-50 text-[#ec0016]"><Ticket :size="21" weight="fill" /></span>
              <div><p class="text-[9px] font-black uppercase tracking-[.14em] text-[#ec0016]">Langkah 2</p><h2 id="voucher-title" class="mt-0.5 text-lg font-black">Voucher</h2></div>
            </header>
            <div class="p-5 sm:p-6">
              <label class="field-label">
                <span>Kode promo <span class="font-semibold text-slate-400">(opsional)</span></span>
                <input v-model.trim="voucherCode" class="field uppercase" maxlength="32" autocomplete="off" placeholder="Contoh: JWLAB10">
                <small class="field-helper">Diskon akan diverifikasi saat pesanan dibuat.</small>
              </label>
            </div>
          </section>

          <section class="surface overflow-hidden lg:hidden">
            <header class="border-b border-slate-100 px-5 py-4"><h2 class="font-black">Item pesanan</h2></header>
            <div class="divide-y divide-slate-100 px-5">
              <div v-for="line in lines" :key="line.variantId" class="flex items-center gap-3 py-4">
                <div class="relative size-14 shrink-0 rounded-xl border border-slate-100 bg-slate-50"><img :src="line.image" :alt="line.name" class="h-full w-full rounded-xl object-contain"><span class="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-900 text-[9px] font-black text-white">{{ line.quantity }}</span></div>
                <div class="min-w-0 flex-1"><p class="truncate text-sm font-black">{{ line.name }}</p><p class="mt-1 text-[10px] text-slate-500">{{ line.sku }}</p></div>
                <strong class="text-sm">{{ formatCurrency(line.unitPrice * line.quantity) }}</strong>
              </div>
            </div>
          </section>
        </div>

        <aside class="surface overflow-hidden lg:sticky lg:top-40">
          <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
            <p class="text-[9px] font-black uppercase tracking-[.14em] text-[#0b4697]">Langkah 3</p>
            <h2 class="mt-1 text-xl font-black">Konfirmasi pesanan</h2>
          </div>

          <div class="hidden max-h-56 divide-y divide-slate-100 overflow-y-auto px-6 lg:block">
            <div v-for="line in lines" :key="line.variantId" class="flex items-center gap-3 py-4">
              <div class="relative size-14 shrink-0 rounded-xl border border-slate-100 bg-slate-50"><img :src="line.image" :alt="line.name" class="h-full w-full rounded-xl object-contain"><span class="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-900 text-[9px] font-black text-white">{{ line.quantity }}</span></div>
              <div class="min-w-0 flex-1"><p class="truncate text-xs font-black">{{ line.name }}</p><p class="mt-1 text-[9px] text-slate-500">{{ line.sku }}</p></div>
              <strong class="text-xs">{{ formatCurrency(line.unitPrice * line.quantity) }}</strong>
            </div>
          </div>

          <div class="border-t border-slate-100 p-5 sm:p-6">
            <dl class="grid gap-3 text-sm">
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Subtotal ({{ count }} item)</dt><dd class="font-bold">{{ formatCurrency(subtotal) }}</dd></div>
              <div class="flex justify-between gap-4"><dt class="text-slate-500">Pengiriman BCE</dt><dd class="font-bold">{{ formatCurrency(shipping?.chargedAmount || 0) }}</dd></div>
              <div v-if="shipping?.discountAmount" class="flex justify-between gap-4 text-emerald-700"><dt>Diskon pengiriman</dt><dd class="font-black">-{{ formatCurrency(shipping.discountAmount) }}</dd></div>
              <div v-if="voucherCode" class="flex justify-between gap-4 text-slate-500"><dt>Voucher {{ voucherCode.toUpperCase() }}</dt><dd class="text-xs font-bold">Diverifikasi berikutnya</dd></div>
            </dl>
            <div class="my-5 border-t border-dashed border-slate-200" />
            <div class="flex items-end justify-between gap-4"><span class="font-black">Total sementara</span><strong class="text-2xl font-black tracking-tight text-[#0b4697]">{{ formatCurrency(total) }}</strong></div>
            <p class="mt-2 text-[10px] leading-5 text-slate-400">Total dapat berkurang setelah voucher berhasil diverifikasi.</p>

            <AppButton class="mt-6 w-full" :disabled="loading || !addressId" @click="checkout">
              <QrCode :size="19" weight="bold" /> {{ loading ? "Menyiapkan pembayaran..." : "Buat pembayaran QRIS" }}
            </AppButton>
            <p v-if="!addressId" class="mt-3 text-center text-[11px] font-bold text-amber-700">Pilih atau tambahkan alamat terlebih dahulu.</p>

            <div class="mt-5 grid gap-2.5 border-t border-slate-100 pt-5 text-[10px] font-semibold text-slate-500">
              <p class="flex items-center gap-2"><ShieldCheck :size="16" weight="fill" class="text-emerald-600" /> Pembayaran QRIS aman dan terverifikasi</p>
              <p class="flex items-center gap-2"><Truck :size="16" weight="fill" class="text-[#0b4697]" /> Resi BCE tersedia setelah pembayaran</p>
              <p class="flex items-center gap-2"><CheckCircle :size="16" weight="fill" class="text-[#0b4697]" /> Stok diamankan selama 30 menit</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
