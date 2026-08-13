<script setup lang="ts">
import { PhEye as Eye, PhEyeSlash as EyeSlash } from "@phosphor-icons/vue";
import { authClient } from "~/lib/auth-client";

definePageMeta({ layout: false });

const route = useRoute();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const { refresh } = useAppSession();

async function login() {
  loading.value = true;
  error.value = "";
  const result = await authClient.signIn.email({ email: email.value, password: password.value });
  if (result.error) {
    error.value = "Email atau password admin tidak cocok.";
    loading.value = false;
    return;
  }
  const session = await refresh();
  if (!session.isAdmin) {
    await authClient.signOut();
    error.value = "Akun tidak memiliki role admin.";
    loading.value = false;
    return;
  }
  const next = String(route.query.next || "/admin");
  await navigateTo(next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
}

useSeoMeta({ title: "Admin Login" });
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-[#071a3d] p-5">
    <form class="surface w-full max-w-md p-8" @submit.prevent="login">
      <div class="text-center">
        <img :src="'/logo-jwlab-studio.webp'" class="mx-auto h-28 w-auto" alt="JWLAB STUDIO">
        <p class="eyebrow mt-2">Control panel</p>
        <h1 class="mt-2 text-2xl font-black">Administrator</h1>
      </div>
      <label class="field-label mt-8">
        Email
        <input v-model="email" type="email" autocomplete="username" class="field" required>
      </label>
      <label class="field-label mt-4">
        Password
        <span class="relative block">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            class="field field-with-action"
            required
          >
          <button
            type="button"
            class="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            :title="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <EyeSlash v-if="showPassword" :size="20" />
            <Eye v-else :size="20" />
          </button>
        </span>
      </label>
      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
      <AppButton type="submit" class="mt-6 w-full" :disabled="loading">{{ loading ? "Memeriksa..." : "Masuk admin" }}</AppButton>
      <NuxtLink to="/" class="mt-5 block text-center text-xs font-bold text-slate-500">Kembali ke toko</NuxtLink>
    </form>
  </main>
</template>
