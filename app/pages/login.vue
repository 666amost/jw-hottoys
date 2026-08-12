<script setup lang="ts">
import { PhGoogleLogo as GoogleLogo, PhShieldCheck as ShieldCheck } from "@phosphor-icons/vue";
import { authClient } from "~/lib/auth-client";
const route = useRoute(); const loading = ref(false); const error = ref("");
const next = computed(() => { const value = String(route.query.next || "/account"); return value.startsWith("/") && !value.startsWith("//") ? value : "/account"; });
async function google() { loading.value = true; error.value = ""; const result = await authClient.signIn.social({ provider: "google", callbackURL: next.value }); if (result.error) { error.value = "Login Google belum dapat dimulai."; loading.value = false; } }
useSeoMeta({ title: "Masuk" });
</script>
<template><section class="container-shell py-16 sm:py-24"><div class="surface mx-auto max-w-md p-7 sm:p-10"><p class="eyebrow">Masuk akun customer</p><h1 class="mt-3 text-3xl font-black">Masuk untuk checkout</h1><p class="mt-3 text-sm leading-6 text-slate-500">Katalog dan keranjang bebas digunakan. Akun Google diperlukan untuk alamat dan pembayaran.</p><AppButton class="mt-8 w-full" :disabled="loading" @click="google"><GoogleLogo :size="21"/>{{ loading ? 'Mengarahkan...' : 'Lanjutkan dengan Google' }}</AppButton><p v-if="error" class="mt-3 text-center text-sm text-red-600">{{ error }}</p><p class="mt-6 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck :size="18" class="shrink-0 text-emerald-600"/>Kami hanya menggunakan nama, email, dan foto profil dari Google.</p><NuxtLink to="/admin/login" class="mt-6 block text-center text-xs font-bold text-slate-400">Login administrator</NuxtLink></div></section></template>
