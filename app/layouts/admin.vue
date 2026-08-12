<script setup lang="ts">
const route = useRoute();
const links = [["/admin","Ringkasan"],["/admin/products","Produk"],["/admin/inventory","Inventory"],["/admin/orders","Pesanan"],["/admin/vouchers","Voucher"],["/admin/content","Content"],["/admin/integrations","Integrasi"]];
</script>
<template><div class="admin-shell min-h-screen"><div class="grid min-h-screen md:grid-cols-[240px_1fr]"><aside class="bg-[#071a3d] p-5 text-white"><NuxtLink to="/" aria-label="JWLAB STUDIO - Beranda"><img src="/logo-jwlab-studio.webp" class="h-20 w-auto" alt="JWLAB STUDIO"></NuxtLink><nav class="mt-8 grid gap-1"><NuxtLink v-for="link in links" :key="link[0]" :to="link[0]" class="rounded-xl px-4 py-3 text-sm font-bold" :class="route.path === link[0] ? 'bg-white text-[#071a3d]' : 'text-slate-300 hover:bg-white/10'">{{ link[1] }}</NuxtLink></nav></aside><main class="min-w-0 p-5 md:p-8"><slot/></main></div></div></template>
