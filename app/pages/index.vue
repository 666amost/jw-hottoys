<script setup lang="ts">
const { data } = await useFetch("/api/catalog");
const { data: announcementData } = await useFetch("/api/announcements");
const products = computed(() => data.value?.products || []);
const featured = computed(() => products.value.filter((product) => product.featured).slice(0, 4));
const announcement = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && (announcementData.value?.announcements.length || 0) > 1) {
    timer = setInterval(() => { announcement.value = (announcement.value + 1) % announcementData.value!.announcements.length; }, 4800);
  }
});
onUnmounted(() => timer && clearInterval(timer));
useSeoMeta({ title: "Original Robot Figures", ogTitle: "JWLAB STUDIO" });
</script>

<template>
  <div>
    <div v-if="announcementData?.announcements?.length" class="bg-[#ec0016] py-2 text-center text-xs font-black uppercase tracking-wider text-white">
      <NuxtLink :to="announcementData.announcements[announcement]?.href || '#'">{{ announcementData.announcements[announcement]?.label }} · {{ announcementData.announcements[announcement]?.message }}</NuxtLink>
    </div>
    <section class="brand-grid overflow-hidden bg-[#071a3d] text-white">
      <div class="container-shell grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div>
          <span class="release-tag">Original robot figures · Jakarta</span>
          <h1 class="display-title mt-7">Robot characters<br><span class="text-[#ec0016]">made real.</span></h1>
          <p class="mt-7 max-w-xl text-base leading-7 text-slate-300">Figure robot orisinal untuk koleksi yang punya cerita, karakter, dan daya display kuat.</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink to="/search" class="rounded-full bg-[#ec0016] px-6 py-3 text-sm font-black hover:bg-[#c90013]">Jelajahi koleksi</NuxtLink>
            <NuxtLink to="/search" class="rounded-full border border-white/30 px-6 py-3 text-sm font-black">Semua figure robot</NuxtLink>
          </div>
        </div>
        <div class="shelf-shadow overflow-hidden rounded-[2rem] bg-white/5"><img src="/hero-collectible-universe-v3.webp" alt="Koleksi figure robot JWLAB STUDIO" class="aspect-[4/3] h-full w-full object-cover"></div>
      </div>
    </section>

    <section class="container-shell py-16">
      <div class="flex items-end justify-between gap-5"><div><p class="eyebrow">Featured release</p><h2 class="section-title mt-3">Figure pilihan studio</h2></div><NuxtLink to="/search" class="text-sm font-black text-[#0b4697]">Lihat semua →</NuxtLink></div>
      <div v-if="featured.length" class="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><ProductCard v-for="product in featured" :key="product.id" :product="product" /></div>
      <div v-else class="surface mt-9 p-10 text-center"><h3 class="text-xl font-black">Koleksi sedang disiapkan</h3><p class="mt-2 text-sm text-slate-500">Figure robot pertama JWLAB STUDIO akan tampil di sini setelah dirilis.</p></div>
    </section>

    <section class="container-shell grid gap-4 md:grid-cols-3">
      <NuxtLink v-for="category in data?.categories" :key="category.id" :to="`/categories/${category.slug}`" class="surface p-6"><p class="eyebrow">Collection</p><h3 class="mt-3 text-xl font-black">{{ category.name }}</h3><p class="mt-2 text-sm leading-6 text-slate-500">{{ category.description }}</p></NuxtLink>
    </section>
  </div>
</template>
