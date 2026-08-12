<script setup lang="ts">
import {
  PhHandbag as Handbag,
  PhHouse as House,
  PhPackage as Package,
  PhSquaresFour as SquaresFour,
  PhUserCircle as UserCircle,
} from "@phosphor-icons/vue";

const route = useRoute();
const { count } = useCart();

const items = [
  { href: "/", label: "Beranda", icon: House, match: (path: string) => path === "/" },
  {
    href: "/search",
    label: "Katalog",
    icon: SquaresFour,
    match: (path: string) => ["/search", "/categories", "/products"].some((prefix) => path.startsWith(prefix)),
  },
  { href: "/cart", label: "Keranjang", icon: Handbag, match: (path: string) => path === "/cart" },
  {
    href: "/account/orders",
    label: "Pesanan",
    icon: Package,
    match: (path: string) => path.startsWith("/account/orders"),
  },
  {
    href: "/account",
    label: "Akun",
    icon: UserCircle,
    match: (path: string) => path.startsWith("/account") && !path.startsWith("/account/orders"),
  },
];
</script>

<template>
  <nav
    aria-label="Navigasi utama mobile"
    class="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(7,26,61,.12)] backdrop-blur-xl md:hidden"
  >
    <div class="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">
      <NuxtLink
        v-for="item in items"
        :key="item.href"
        :to="item.href"
        :aria-current="item.match(route.path) ? 'page' : undefined"
        class="group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold transition-colors"
        :class="item.match(route.path) ? 'text-[#ec0016]' : 'text-slate-400 hover:text-[#111217]'"
      >
        <span
          v-if="item.match(route.path)"
          class="absolute top-0 h-0.5 w-8 rounded-full bg-[#ec0016]"
          aria-hidden="true"
        />
        <span class="relative transition-transform duration-200 group-active:scale-90">
          <component :is="item.icon" :size="23" :weight="item.match(route.path) ? 'fill' : 'regular'" />
          <span
            v-if="item.href === '/cart' && count > 0"
            class="absolute -right-2.5 -top-2 grid min-w-[18px] place-items-center rounded-full bg-[#ec0016] px-1 text-[9px] font-black leading-[18px] text-white ring-2 ring-white"
          >
            {{ count > 99 ? "99+" : count }}
          </span>
        </span>
        <span class="max-w-full truncate">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
