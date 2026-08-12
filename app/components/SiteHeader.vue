<script setup lang="ts">
import {
  PhMagnifyingGlass as MagnifyingGlass,
  PhShoppingBag as ShoppingBag,
  PhUserCircle as UserCircle,
} from "@phosphor-icons/vue";

const route = useRoute();
const searchInput = ref<HTMLInputElement | null>(null);
const searchQuery = ref(String(route.query.q || ""));
const announcement = ref(0);
const { count } = useCart();
const { session, loaded, refresh } = useAppSession();
const { data: catalog } = await useFetch("/api/catalog");
const { data: announcementData } = await useFetch("/api/announcements");
let announcementTimer: ReturnType<typeof setInterval> | undefined;

function search() {
  const query = searchQuery.value.trim();
  void navigateTo({ path: "/search", query: query ? { q: query } : undefined });
}

function focusSearch(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.value?.focus();
  }
}

onMounted(() => {
  if (!loaded.value) void refresh();
  window.addEventListener("keydown", focusSearch);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && (announcementData.value?.announcements.length || 0) > 1) {
    announcementTimer = setInterval(() => {
      announcement.value = (announcement.value + 1) % announcementData.value!.announcements.length;
    }, 4800);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", focusSearch);
  if (announcementTimer) clearInterval(announcementTimer);
});

watch(() => route.query.q, (value) => { searchQuery.value = String(value || ""); });
</script>

<template>
  <header class="store-header sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">
    <div v-if="announcementData?.announcements?.length" class="bg-[#071a3d] text-white">
      <div class="container-shell flex min-h-8 items-center justify-center px-4 text-center text-[10px] font-extrabold uppercase tracking-[.13em] sm:text-xs">
        <Transition name="announcement" mode="out-in">
          <NuxtLink
            :key="announcement"
            :to="announcementData.announcements[announcement]?.href || '/search'"
            class="py-2 hover:text-red-300"
          >
            <span class="text-[#ff5362]">{{ announcementData.announcements[announcement]?.label }}</span>
            <span class="mx-2 text-white/35">•</span>
            {{ announcementData.announcements[announcement]?.message }}
          </NuxtLink>
        </Transition>
      </div>
    </div>

    <div class="container-shell">
      <div class="flex min-h-[72px] items-center gap-3 py-2 lg:gap-6">
        <NuxtLink to="/" aria-label="JWLAB STUDIO - Beranda" class="flex shrink-0 items-center">
          <img :src="'/logo-jwlab-studio.webp'" alt="JWLAB STUDIO" class="h-14 w-14 object-contain sm:h-16 sm:w-16">
        </NuxtLink>

        <form class="relative hidden min-w-0 flex-1 md:block" role="search" @submit.prevent="search">
          <MagnifyingGlass :size="21" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="search"
            class="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-24 text-sm font-semibold outline-none transition placeholder:font-normal focus:border-[#0b4697] focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Cari figure, karakter, atau SKU..."
            aria-label="Cari produk"
          >
          <span class="pointer-events-none absolute right-14 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-400 xl:block">Ctrl K</span>
          <button type="submit" class="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[#ec0016] text-white transition hover:bg-[#c90013]" aria-label="Cari">
            <MagnifyingGlass :size="18" weight="bold" />
          </button>
        </form>

        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <NuxtLink
            :to="session.user ? '/account' : '/login'"
            class="flex h-11 items-center gap-2 rounded-xl px-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3"
          >
            <UserCircle :size="23" />
            <span class="hidden text-xs font-bold lg:block">{{ session.user ? "Akun" : "Masuk" }}</span>
          </NuxtLink>
          <NuxtLink to="/cart" class="relative flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            <ShoppingBag :size="21" />
            <span class="hidden text-xs font-black sm:block">Keranjang</span>
            <span v-if="count" class="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#ec0016] px-1 text-[9px] font-black text-white ring-2 ring-white">{{ count > 99 ? "99+" : count }}</span>
          </NuxtLink>
        </div>
      </div>

      <form class="relative mb-2 md:hidden" role="search" @submit.prevent="search">
        <MagnifyingGlass :size="19" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="search"
          class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-14 text-sm font-semibold outline-none focus:border-[#0b4697] focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="Cari figure atau karakter..."
          aria-label="Cari produk"
        >
        <button type="submit" class="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg bg-[#ec0016] text-white" aria-label="Cari"><MagnifyingGlass :size="17" weight="bold" /></button>
      </form>
    </div>

    <nav class="border-t border-slate-100" aria-label="Kategori produk">
      <div class="container-shell hide-scrollbar flex items-center gap-1 overflow-x-auto py-2 text-xs font-bold whitespace-nowrap">
        <NuxtLink to="/search" class="store-category-link border border-red-100 bg-red-50 text-[#c90013] hover:border-[#ec0016] hover:bg-[#ec0016] hover:text-white">Semua koleksi</NuxtLink>
        <NuxtLink v-for="category in catalog?.categories" :key="category.id" :to="`/categories/${category.slug}`" class="store-category-link">{{ category.name }}</NuxtLink>
        <NuxtLink to="/?material=pla#pla-series" class="store-category-link">Premium PLA</NuxtLink>
        <NuxtLink to="/?material=resin#resin-line" class="store-category-link"><span class="mr-1.5 inline-block size-1.5 rounded-full bg-[#ec0016]" />Resin segera</NuxtLink>
      </div>
    </nav>
  </header>
</template>
