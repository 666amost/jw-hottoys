<script setup lang="ts">
import { PhList as List, PhMagnifyingGlass as MagnifyingGlass, PhShoppingBag as ShoppingBag, PhUserCircle as UserCircle, PhX as X } from "@phosphor-icons/vue";
const open = ref(false);
const { count } = useCart();
const { session, loaded, refresh } = useAppSession();
onMounted(() => { if (!loaded.value) void refresh(); });
</script>
<template>
  <header class="sticky top-0 z-50 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur">
    <div class="container-shell flex h-20 items-center justify-between gap-4">
      <NuxtLink to="/" aria-label="JWLAB STUDIO - Beranda" class="flex items-center"><img src="/logo-jwlab-studio.webp" alt="JWLAB STUDIO" class="h-16 w-auto"></NuxtLink>
      <nav class="hidden items-center gap-6 text-sm font-bold md:flex">
        <NuxtLink to="/search">Koleksi figure robot</NuxtLink><NuxtLink to="/account">Akun</NuxtLink>
      </nav>
      <div class="flex items-center gap-1">
        <NuxtLink to="/search" class="grid h-10 w-10 place-items-center rounded-full hover:bg-white"><MagnifyingGlass :size="21" /></NuxtLink>
        <NuxtLink :to="session.user ? '/account' : '/login'" class="grid h-10 w-10 place-items-center rounded-full hover:bg-white"><UserCircle :size="22" /></NuxtLink>
        <NuxtLink to="/cart" class="relative grid h-10 w-10 place-items-center rounded-full hover:bg-white"><ShoppingBag :size="21" /><span v-if="count" class="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#ec0016] px-1 text-[10px] font-black text-white">{{ count }}</span></NuxtLink>
        <button class="grid h-10 w-10 place-items-center md:hidden" aria-label="Menu" @click="open = !open"><X v-if="open" :size="22"/><List v-else :size="22"/></button>
      </div>
    </div>
    <nav v-if="open" class="container-shell grid gap-1 border-t py-3 md:hidden" @click="open=false">
      <NuxtLink class="mobile-nav-link" to="/search">Semua figure robot</NuxtLink><NuxtLink class="mobile-nav-link" to="/account">Akun saya</NuxtLink>
    </nav>
  </header>
</template>
