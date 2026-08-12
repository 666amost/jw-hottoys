<script setup lang="ts">
import {
  PhArrowSquareOut as ArrowSquareOut,
  PhCaretRight as CaretRight,
  PhGauge as Gauge,
  PhList as List,
  PhMegaphone as Megaphone,
  PhPackage as Package,
  PhPercent as Percent,
  PhPlugsConnected as PlugsConnected,
  PhSignOut as SignOut,
  PhStack as Stack,
  PhStorefront as Storefront,
  PhX as X,
} from "@phosphor-icons/vue";
import { authClient } from "~/lib/auth-client";

const route = useRoute();
const sidebarOpen = ref(false);
const signingOut = ref(false);
const { session } = useAppSession();

const navigation = [
  {
    label: "Ringkasan",
    links: [{ href: "/admin", label: "Dashboard", icon: Gauge }],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/products", label: "Produk", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Stack },
      { href: "/admin/orders", label: "Pesanan", icon: Storefront },
      { href: "/admin/vouchers", label: "Voucher", icon: Percent },
    ],
  },
  {
    label: "Website & layanan",
    links: [
      { href: "/admin/content", label: "Billboard", icon: Megaphone },
      { href: "/admin/integrations", label: "Integrasi BCE", icon: PlugsConnected },
    ],
  },
];

const allLinks = navigation.flatMap((section) => section.links);
const isActive = (href: string) => href === "/admin"
  ? route.path === href
  : route.path === href || route.path.startsWith(`${href}/`);
const currentPage = computed(() => allLinks.find((item) => isActive(item.href))?.label ?? "Admin");
const displayName = computed(() => session.value.user?.name || "Administrator");
const email = computed(() => session.value.user?.email || "JWLAB admin");
const initials = computed(() => displayName.value
  .split(" ")
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase() || "AD");

watch(() => route.fullPath, () => { sidebarOpen.value = false; });

async function logout() {
  signingOut.value = true;
  await authClient.signOut();
  session.value = { user: null, isAdmin: false };
  await navigateTo("/admin/login");
}
</script>

<template>
  <div class="admin-shell min-h-dvh text-slate-900">
    <a href="#admin-content" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-bold">
      Lewati ke konten
    </a>

    <button
      type="button"
      aria-label="Tutup navigasi"
      class="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] transition-opacity md:hidden"
      :class="sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden border-r border-slate-200 bg-[#fbfbfc] text-slate-600 shadow-2xl transition-transform duration-300 md:translate-x-0 md:shadow-none"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200/80 px-6">
        <NuxtLink to="/" aria-label="JWLAB STUDIO - Beranda" class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#071a3d] shadow-sm">
          <img src="/brand-mark.svg" alt="" class="size-8" aria-hidden="true">
        </NuxtLink>
        <div class="min-w-0">
          <p class="truncate text-sm font-black tracking-tight text-slate-950">JWLAB STUDIO</p>
          <p class="mt-1 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#d7192d]">Admin workspace</p>
        </div>
        <button
          type="button"
          class="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Tutup menu"
          @click="sidebarOpen = false"
        >
          <X :size="20" />
        </button>
      </div>

      <nav class="admin-scrollbar flex-1 overflow-y-auto px-4 py-5" aria-label="Navigasi admin">
        <section v-for="section in navigation" :key="section.label" class="mb-6 last:mb-0">
          <p class="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">{{ section.label }}</p>
          <div class="grid gap-1">
            <NuxtLink
              v-for="link in section.links"
              :key="link.href"
              :to="link.href"
              :aria-current="isActive(link.href) ? 'page' : undefined"
              class="group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition"
              :class="isActive(link.href) ? 'bg-[#fff0f2] text-[#c91425] ring-1 ring-inset ring-[#e21b2d]/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'"
            >
              <span v-if="isActive(link.href)" class="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#e21b2d]" aria-hidden="true" />
              <component :is="link.icon" :size="19" :weight="isActive(link.href) ? 'fill' : 'regular'" />
              <span>{{ link.label }}</span>
              <CaretRight
                :size="14"
                class="ml-auto transition"
                :class="isActive(link.href) ? 'opacity-100' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'"
              />
            </NuxtLink>
          </div>
        </section>
      </nav>

      <div class="shrink-0 border-t border-slate-200/80 p-4">
        <div class="mb-2 flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">{{ initials }}</span>
          <div class="min-w-0">
            <p class="truncate text-xs font-bold text-slate-900">{{ displayName }}</p>
            <p class="mt-0.5 truncate text-[10px] text-slate-400">{{ email }}</p>
          </div>
        </div>
        <button
          type="button"
          class="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          :disabled="signingOut"
          @click="logout"
        >
          <SignOut :size="18" /> {{ signingOut ? "Keluar..." : "Keluar dari admin" }}
        </button>
      </div>
    </aside>

    <div class="min-h-dvh md:pl-[280px]">
      <header class="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button
          type="button"
          class="mr-3 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden"
          aria-label="Buka navigasi"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <List :size="21" weight="bold" />
        </button>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Control room</p>
          <p class="text-sm font-black text-slate-900">{{ currentPage }}</p>
        </div>
        <div class="ml-auto flex items-center gap-3">
          <NuxtLink
            to="/"
            target="_blank"
            class="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 sm:flex"
          >
            Lihat toko <ArrowSquareOut :size="16" />
          </NuxtLink>
          <span class="grid size-9 place-items-center rounded-full bg-[#111318] text-[11px] font-black text-white ring-4 ring-slate-100">{{ initials }}</span>
        </div>
      </header>

      <main id="admin-content" class="mx-auto w-full max-w-[1540px] p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
