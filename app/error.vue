<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>();
</script>

<template>
  <NuxtLayout>
    <section class="container-shell py-24 text-center">
      <p class="eyebrow">{{ error.statusCode || 500 }}</p>
      <h1 class="mt-3 text-4xl font-black">Halaman belum dapat ditampilkan</h1>
      <p class="mt-3 text-slate-500">{{ error.statusMessage || 'Terjadi kesalahan pada aplikasi.' }}</p>
      <button class="mt-7 rounded-full bg-[#0b4697] px-6 py-3 font-bold text-white" @click="clearError({ redirect: '/' })">Kembali ke toko</button>
    </section>
  </NuxtLayout>
</template>
