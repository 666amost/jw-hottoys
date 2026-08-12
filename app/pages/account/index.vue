<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
definePageMeta({middleware:"auth"}); const {session,refresh}=useAppSession(); await refresh();
async function logout(){ await authClient.signOut(); session.value={user:null,isAdmin:false}; await navigateTo("/"); }
useSeoMeta({title:"Akun Saya"});
</script>
<template><section class="container-shell py-12"><p class="eyebrow">My account</p><h1 class="section-title mt-3">Halo, {{ session.user?.name }}</h1><div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><NuxtLink to="/account/orders" class="surface p-6"><h2 class="text-xl font-black">Pesanan</h2><p class="mt-2 text-sm text-slate-500">Pantau pembayaran, status dan resi.</p></NuxtLink><NuxtLink to="/account/addresses" class="surface p-6"><h2 class="text-xl font-black">Alamat</h2><p class="mt-2 text-sm text-slate-500">Kelola tujuan pengiriman.</p></NuxtLink><NuxtLink v-if="session.isAdmin" to="/admin" class="surface p-6"><h2 class="text-xl font-black">Admin</h2><p class="mt-2 text-sm text-slate-500">Buka dashboard operasional.</p></NuxtLink></div><AppButton class="mt-8" variant="secondary" @click="logout">Keluar akun</AppButton></section></template>
