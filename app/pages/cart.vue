<script setup lang="ts">
import {
  PhArrowLeft as ArrowLeft,
  PhArrowRight as ArrowRight,
  PhHandbag as Handbag,
  PhMinus as Minus,
  PhPackage as Package,
  PhPlus as Plus,
  PhShieldCheck as ShieldCheck,
  PhTrash as Trash,
  PhTruck as Truck,
} from "@phosphor-icons/vue";
import { formatCurrency } from "~~/shared/format";

const { lines, count, subtotal, update } = useCart();

function changeQuantity(variantId: string, current: number, delta: number) {
  update(variantId, current + delta);
}

useSeoMeta({
  title: "Keranjang Belanja",
  description: "Periksa produk, jumlah, dan estimasi pengiriman sebelum melanjutkan checkout.",
});
</script>

<template>
  <main class="pb-24 sm:pb-16">
    <section class="border-b border-slate-200/80 bg-gradient-to-br from-white via-white to-red-50/40">
      <div class="container-shell py-8 sm:py-11">
        <NuxtLink to="/search" class="inline-flex items-center gap-2 text-xs font-black text-slate-500 transition hover:text-[#0b4697]"><ArrowLeft :size="16" /> Lanjut belanja</NuxtLink>
        <div class="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="eyebrow">Shopping bag</p>
            <h1 class="section-title mt-2">Keranjang belanja</h1>
            <p class="mt-3 text-sm text-slate-500">{{ count }} item siap diperiksa sebelum checkout.</p>
          </div>
          <ol class="flex max-w-md items-center text-[10px] font-black uppercase tracking-[.08em] text-slate-400 sm:w-full" aria-label="Tahapan checkout">
            <li class="flex items-center gap-2 text-[#0b4697]"><span class="grid size-7 place-items-center rounded-full bg-[#0b4697] text-white">1</span> Keranjang</li>
            <li class="mx-3 h-px flex-1 bg-slate-200" />
            <li class="flex items-center gap-2"><span class="grid size-7 place-items-center rounded-full border border-slate-300 bg-white">2</span> Pengiriman</li>
            <li class="mx-3 h-px flex-1 bg-slate-200" />
            <li class="flex items-center gap-2"><span class="grid size-7 place-items-center rounded-full border border-slate-300 bg-white">3</span> Bayar</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="container-shell py-7 sm:py-10">
      <div v-if="!lines.length" class="surface mx-auto max-w-2xl px-6 py-14 text-center sm:py-20">
        <span class="mx-auto grid size-16 place-items-center rounded-3xl bg-blue-50 text-[#0b4697]"><Handbag :size="32" weight="duotone" /></span>
        <h2 class="mt-5 text-2xl font-black">Keranjangmu masih kosong</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Temukan figure yang cocok untuk koleksimu, lalu tambahkan ke keranjang.</p>
        <NuxtLink to="/search" class="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0b4697] px-6 text-sm font-black text-white transition hover:bg-[#073979]">Jelajahi koleksi <ArrowRight :size="17" /></NuxtLink>
      </div>

      <div v-else class="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_370px] xl:gap-8">
        <div class="min-w-0">
          <div class="mb-4 flex items-center justify-between px-1">
            <h2 class="text-lg font-black">Produk pilihan</h2>
            <span class="text-xs font-bold text-slate-400">{{ lines.length }} produk</span>
          </div>

          <div class="grid gap-4">
            <article v-for="line in lines" :key="line.variantId" class="surface group overflow-hidden p-4 sm:p-5">
              <div class="grid grid-cols-[92px_minmax(0,1fr)] gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                <NuxtLink :to="`/products/${line.slug}`" class="aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <img :src="line.image" :alt="line.name" class="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-105">
                </NuxtLink>

                <div class="flex min-w-0 flex-col">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-[9px] font-black uppercase tracking-[.14em] text-[#ec0016]">Collectible figure</p>
                      <NuxtLink :to="`/products/${line.slug}`" class="mt-1 block text-base font-black leading-6 text-slate-950 hover:text-[#0b4697] sm:text-lg">{{ line.name }}</NuxtLink>
                      <p class="mt-1 text-xs text-slate-500">SKU {{ line.sku }}</p>
                    </div>
                    <div class="shrink-0 text-right">
                      <strong class="hidden text-lg font-black sm:block">{{ formatCurrency(line.unitPrice * line.quantity) }}</strong>
                      <button type="button" class="grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 sm:ml-auto sm:mt-2 sm:flex sm:w-auto sm:gap-1.5 sm:px-2 sm:text-xs sm:font-bold" :aria-label="`Hapus ${line.name}`" @click="update(line.variantId, 0)"><Trash :size="16" /><span class="hidden sm:inline">Hapus</span></button>
                    </div>
                  </div>
                  <p class="mt-3 text-sm font-black text-[#0b4697]">{{ formatCurrency(line.unitPrice) }} <span class="text-[10px] font-semibold text-slate-400">/ unit</span></p>
                  <p v-if="line.availableStock <= 5" class="mt-1 text-[10px] font-bold text-amber-700">Tersisa {{ line.availableStock }} unit</p>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 sm:mt-auto sm:border-0 sm:pt-3">
                    <div class="inline-flex h-11 items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm" aria-label="Jumlah produk">
                      <button type="button" class="grid size-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-35" :disabled="line.quantity <= 1" :aria-label="`Kurangi jumlah ${line.name}`" @click="changeQuantity(line.variantId, line.quantity, -1)"><Minus :size="15" weight="bold" /></button>
                      <span class="min-w-9 text-center text-sm font-black" aria-live="polite">{{ line.quantity }}</span>
                      <button type="button" class="grid size-8 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-35" :disabled="line.quantity >= line.availableStock" :aria-label="`Tambah jumlah ${line.name}`" @click="changeQuantity(line.variantId, line.quantity, 1)"><Plus :size="15" weight="bold" /></button>
                    </div>
                    <strong class="text-base font-black sm:hidden">{{ formatCurrency(line.unitPrice * line.quantity) }}</strong>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><Package :size="22" weight="fill" class="shrink-0 text-[#0b4697]" /><p class="text-xs leading-5 text-slate-600"><b class="block text-slate-900">Dikemas aman</b>Setiap figure dilindungi untuk perjalanan pengiriman.</p></div>
            <div class="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"><ShieldCheck :size="22" weight="fill" class="shrink-0 text-emerald-700" /><p class="text-xs leading-5 text-slate-600"><b class="block text-slate-900">Checkout terlindungi</b>Pembayaran diproses melalui QRIS terverifikasi.</p></div>
          </div>
        </div>

        <aside class="surface overflow-hidden md:sticky md:top-40">
          <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 class="text-xl font-black">Ringkasan belanja</h2>
            <p class="mt-1 text-xs text-slate-500">Biaya akhir dikonfirmasi sebelum pembayaran.</p>
          </div>
          <div class="p-5 sm:p-6">
            <dl class="grid gap-4 text-sm">
              <div class="flex justify-between gap-5"><dt class="text-slate-500">Subtotal ({{ count }} item)</dt><dd class="font-bold">{{ formatCurrency(subtotal) }}</dd></div>
              <div class="flex justify-between gap-5"><dt class="text-slate-500">Ongkir</dt><dd class="text-right text-xs font-bold text-slate-500">Dihitung dari alamat</dd></div>
            </dl>
            <div class="my-5 border-t border-dashed border-slate-200" />
            <div class="flex items-end justify-between gap-4"><span class="font-black">Subtotal</span><strong class="text-2xl font-black tracking-tight text-[#0b4697]">{{ formatCurrency(subtotal) }}</strong></div>
            <p class="mt-2 flex items-start gap-2 text-[11px] leading-5 text-slate-500"><Truck :size="16" class="mt-0.5 shrink-0 text-[#0b4697]" /> BCE Express untuk area layanan lokal, JNE untuk wilayah Indonesia lainnya.</p>
            <NuxtLink to="/checkout" class="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0b4697] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(11,70,151,.22)] transition hover:-translate-y-0.5 hover:bg-[#073979]">Pilih pengiriman <ArrowRight :size="17" weight="bold" /></NuxtLink>
            <div class="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400"><ShieldCheck :size="15" weight="fill" class="text-emerald-600" /> Pembayaran aman & terverifikasi</div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
