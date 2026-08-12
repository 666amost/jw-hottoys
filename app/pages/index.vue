<script setup lang="ts">
import {
  PhArrowLeft as ArrowLeft,
  PhArrowRight as ArrowRight,
  PhCheckCircle as CheckCircle,
  PhCube as Cube,
  PhMapPin as MapPin,
  PhPause as Pause,
  PhPlay as Play,
  PhShieldCheck as ShieldCheck,
  PhSparkle as Sparkle,
  PhTruck as Truck,
} from "@phosphor-icons/vue";

const { data } = await useFetch("/api/catalog");
const products = computed(() => data.value?.products || []);
const featured = computed(() => {
  const selected = products.value.filter((product) => product.featured);
  return (selected.length ? selected : products.value).slice(0, 4);
});

const slides = [
  {
    eyebrow: "JWLAB original collection",
    title: "Dibuat khusus",
    accent: "Untuk Penghobi.",
    description: "Karakter robot dan collectible buatan studio Indonesia—dirancang untuk punya cerita, pose, dan daya display yang kuat.",
    image: "/hero-collectible-universe-v3.webp",
    imageAlt: "Figure robot koleksi JWLAB STUDIO",
    primary: "Jelajahi koleksi",
    primaryHref: "/search",
    secondary: "Kenali JWLAB",
    secondaryHref: "#studio-showcase",
    tags: ["Original character", "Studio made", "Collector ready"],
    theme: "theme-studio",
    layout: "layout-background",
  },
  {
    eyebrow: "Premium PLA series",
    title: "Bukan sekadar",
    accent: "hasil print.",
    description: "Detail layer yang dikontrol, konstruksi solid, finishing rapi, dan karakter yang dibuat untuk dinikmati dari dekat.",
    image: "/product-fighter-duo-v2.webp",
    imageAlt: "Duo figure karakter premium PLA",
    primary: "Lihat PLA series",
    primaryHref: "#pla-series",
    secondary: "Belanja sekarang",
    secondaryHref: "/search",
    tags: ["Premium PLA", "Fine detail", "Display ready"],
    theme: "theme-pla",
    layout: "layout-split",
  },
  {
    eyebrow: "Next material exploration",
    title: "Resin series",
    accent: "is coming.",
    description: "Kami sedang menyiapkan lini resin untuk detail yang lebih halus, bentuk lebih ekspresif, dan rilisan kolektor berikutnya.",
    image: "/product-designer-buddy-v2.webp",
    imageAlt: "Visual pengembangan karakter JWLAB",
    primary: "Intip arahnya",
    primaryHref: "#resin-line",
    secondary: "Lihat rilisan",
    secondaryHref: "/search",
    tags: ["In development", "Sharper detail", "Future release"],
    theme: "theme-resin",
    layout: "layout-split",
  },
];

const showcases = [
  { title: "Designer Buddy", label: "Friendly robot", image: "/product-designer-buddy-v2.webp", position: "center 40%" },
  { title: "Fighter Duo", label: "Dynamic characters", image: "/product-fighter-duo-v2.webp", position: "center 35%" },
  { title: "Mini Unit", label: "Pocket scale", image: "/product-mini-robot-v2.webp", position: "center 38%" },
  { title: "Ninja Chibi", label: "Expressive pose", image: "/product-ninja-chibi-v2.webp", position: "center 32%" },
];

const activeSlide = ref(0);
const heroPaused = ref(false);
const heroHovered = ref(false);
const touchStartX = ref(0);
let heroTimer: ReturnType<typeof setInterval> | undefined;

function goToSlide(index: number) {
  activeSlide.value = (index + slides.length) % slides.length;
}

function nextSlide() {
  goToSlide(activeSlide.value + 1);
}

function previousSlide() {
  goToSlide(activeSlide.value - 1);
}

function onTouchStart(event: TouchEvent) {
  touchStartX.value = event.touches[0]?.clientX || 0;
}

function onTouchEnd(event: TouchEvent) {
  const endX = event.changedTouches[0]?.clientX || 0;
  const distance = endX - touchStartX.value;
  if (Math.abs(distance) < 48) return;
  if (distance < 0) nextSlide();
  else previousSlide();
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroPaused.value = true;
    return;
  }
  heroTimer = setInterval(() => {
    if (!heroPaused.value && !heroHovered.value) nextSlide();
  }, 6200);
});

onBeforeUnmount(() => {
  if (heroTimer) clearInterval(heroTimer);
});

useSeoMeta({
  title: "Premium PLA & Resin Collectible Figures",
  description: "Figure 3D premium PLA dan collectible characters dari JWLAB STUDIO. Resin series segera hadir.",
  ogTitle: "JWLAB STUDIO — Collectible Figures Made in Indonesia",
});
</script>

<template>
  <div class="home-storefront">
    <section class="container-shell pt-4 sm:pt-6" aria-label="Sorotan JWLAB STUDIO">
      <div
        class="home-hero-stage relative overflow-hidden rounded-[1.5rem] shadow-[0_24px_70px_rgba(7,26,61,.18)] sm:rounded-[2rem]"
        role="region"
        aria-roledescription="carousel"
        :aria-label="`Slide ${activeSlide + 1} dari ${slides.length}`"
        @mouseenter="heroHovered = true"
        @mouseleave="heroHovered = false"
        @focusin="heroHovered = true"
        @focusout="heroHovered = false"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <Transition name="hero-slide" mode="out-in">
          <article :key="activeSlide" class="home-hero-slide" :class="[slides[activeSlide]?.theme, slides[activeSlide]?.layout]">
            <div class="home-hero-media" aria-hidden="true">
              <img :src="slides[activeSlide]?.image" :alt="slides[activeSlide]?.imageAlt" :loading="activeSlide === 0 ? 'eager' : 'lazy'">
            </div>
            <div class="home-hero-copy">
              <p class="home-hero-eyebrow"><Sparkle :size="15" weight="fill" />{{ slides[activeSlide]?.eyebrow }}</p>
              <h1>{{ slides[activeSlide]?.title }} <span>{{ slides[activeSlide]?.accent }}</span></h1>
              <p class="home-hero-description">{{ slides[activeSlide]?.description }}</p>
              <div class="home-hero-tags">
                <span v-for="tag in slides[activeSlide]?.tags" :key="tag"><CheckCircle :size="14" weight="fill" />{{ tag }}</span>
              </div>
              <div class="mt-6 flex flex-wrap gap-2.5 sm:mt-8">
                <NuxtLink :to="slides[activeSlide]?.primaryHref" class="home-hero-button is-primary">{{ slides[activeSlide]?.primary }} <ArrowRight :size="17" weight="bold" /></NuxtLink>
                <NuxtLink :to="slides[activeSlide]?.secondaryHref" class="home-hero-button is-secondary">{{ slides[activeSlide]?.secondary }}</NuxtLink>
              </div>
            </div>
          </article>
        </Transition>

        <button type="button" class="home-hero-arrow left-3 sm:left-5" aria-label="Banner sebelumnya" @click="previousSlide"><ArrowLeft :size="20" weight="bold" /></button>
        <button type="button" class="home-hero-arrow right-3 sm:right-5" aria-label="Banner berikutnya" @click="nextSlide"><ArrowRight :size="20" weight="bold" /></button>

        <div class="home-hero-controls">
          <button
            v-for="(_, index) in slides"
            :key="index"
            type="button"
            class="home-hero-dot"
            :class="index === activeSlide ? 'is-active' : ''"
            :aria-label="`Tampilkan banner ${index + 1}`"
            :aria-current="index === activeSlide ? 'true' : undefined"
            @click="goToSlide(index)"
          />
          <button type="button" class="ml-1 grid size-7 place-items-center rounded-full text-current opacity-65 transition hover:bg-black/10 hover:opacity-100" :aria-label="heroPaused ? 'Putar banner otomatis' : 'Jeda banner otomatis'" @click="heroPaused = !heroPaused">
            <Play v-if="heroPaused" :size="13" weight="fill" />
            <Pause v-else :size="13" weight="fill" />
          </button>
        </div>
      </div>
    </section>

    <section class="container-shell py-5 sm:py-7" aria-label="Keunggulan layanan">
      <div class="hide-scrollbar flex gap-3 overflow-x-auto rounded-2xl border border-black/10 bg-white p-3 shadow-sm md:grid md:grid-cols-4 md:gap-0 md:p-0">
        <div class="home-trust-item"><MapPin :size="21" weight="fill" /><span><b>Made in Indonesia</b><small>Dibuat oleh studio lokal</small></span></div>
        <div class="home-trust-item"><Cube :size="21" weight="fill" /><span><b>Premium material</b><small>PLA kini, resin berikutnya</small></span></div>
        <div class="home-trust-item"><ShieldCheck :size="21" weight="fill" /><span><b>Secure checkout</b><small>Pembayaran terverifikasi</small></span></div>
        <div class="home-trust-item"><Truck :size="21" weight="fill" /><span><b>Tracked delivery</b><small>Dikirim dengan BCE Express</small></span></div>
      </div>
    </section>

    <section class="container-shell py-10 sm:py-14">
      <div class="flex items-end justify-between gap-5">
        <div>
          <p class="eyebrow">Fresh from the studio</p>
          <h2 class="section-title mt-3">Rilisan pilihan</h2>
          <p class="mt-3 max-w-xl text-sm leading-6 text-slate-500">Karakter terbaru dan figure yang sedang menjadi sorotan kolektor.</p>
        </div>
        <NuxtLink to="/search" class="hidden items-center gap-1.5 text-sm font-black text-[#0b4697] hover:text-[#ec0016] sm:flex">Lihat semua <ArrowRight :size="17" /></NuxtLink>
      </div>

      <div v-if="featured.length" class="hide-scrollbar mt-7 flex snap-x gap-4 overflow-x-auto pb-5 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">
        <ProductCard v-for="product in featured" :key="product.id" :product="product" class="w-[78vw] max-w-[310px] shrink-0 snap-start md:w-auto md:max-w-none" />
      </div>
      <div v-else class="mt-7 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
        <div><p class="text-lg font-black">Drop pertama sedang disiapkan.</p><p class="mt-1 text-sm leading-6 text-slate-500">Sambil menunggu produk dipublikasikan, jelajahi karakter dan material JWLAB di bawah.</p></div>
        <NuxtLink to="#studio-showcase" class="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071a3d] px-5 py-3 text-xs font-black text-white sm:mt-0">Lihat showcase <ArrowRight :size="16" /></NuxtLink>
      </div>
      <NuxtLink to="/search" class="mt-2 flex items-center justify-center gap-1.5 text-sm font-black text-[#0b4697] sm:hidden">Lihat semua koleksi <ArrowRight :size="17" /></NuxtLink>
    </section>

    <section id="studio-showcase" class="overflow-hidden bg-[#071a3d] py-14 text-white sm:py-20">
      <div class="container-shell">
        <div class="max-w-2xl">
          <p class="eyebrow !text-[#ff5362]">Character universe</p>
          <h2 class="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">Bukan barang generik.<br>Setiap karakter punya sikap.</h2>
          <p class="mt-4 text-sm leading-7 text-slate-300 sm:text-base">Dari robot ramah sampai fighter dan ninja—JWLAB mengeksplorasi bentuk yang ekspresif untuk koleksi personal Anda.</p>
        </div>

        <div class="hide-scrollbar mt-9 flex snap-x gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          <article v-for="(item, index) in showcases" :key="item.title" class="group relative aspect-[4/5] w-[72vw] max-w-[290px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white lg:w-auto lg:max-w-none" :class="index % 2 ? 'lg:translate-y-7' : ''">
            <img :src="item.image" :alt="item.title" class="h-full w-full object-cover transition duration-700 group-hover:scale-105" :style="{ objectPosition: item.position }" loading="lazy">
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 pt-16">
              <p class="text-[9px] font-extrabold uppercase tracking-[.18em] text-red-300">{{ item.label }}</p>
              <h3 class="mt-1 text-xl font-black">{{ item.title }}</h3>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="container-shell grid gap-5 py-14 lg:grid-cols-2 lg:py-20">
      <article id="pla-series" class="material-card material-pla overflow-hidden rounded-[1.75rem] border border-black/10 bg-white">
        <div class="grid min-h-[420px] sm:grid-cols-[1fr_.9fr]">
          <div class="relative z-10 flex flex-col justify-center p-7 sm:p-9">
            <p class="eyebrow">Available material</p>
            <h2 class="mt-3 text-3xl font-black tracking-[-.045em]">Premium PLA</h2>
            <p class="mt-4 text-sm leading-7 text-slate-600">Ringan, kokoh, dan ideal untuk figure berkarakter dengan skala display yang fleksibel.</p>
            <ul class="mt-6 grid gap-2 text-xs font-bold text-slate-700">
              <li><CheckCircle :size="17" weight="fill" />Layer detail terkontrol</li>
              <li><CheckCircle :size="17" weight="fill" />Finishing warna berkarakter</li>
              <li><CheckCircle :size="17" weight="fill" />Cocok untuk daily display</li>
            </ul>
            <NuxtLink to="/search" class="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#0b4697] px-5 py-3 text-xs font-black text-white">Belanja PLA <ArrowRight :size="16" /></NuxtLink>
          </div>
          <div class="min-h-72 overflow-hidden bg-[#eef0ed] sm:min-h-0"><img :src="'/product-mini-robot-v2.webp'" alt="Contoh karakter premium PLA" class="h-full w-full object-cover object-top" loading="lazy"></div>
        </div>
      </article>

      <article id="resin-line" class="material-card material-resin relative min-h-[420px] overflow-hidden rounded-[1.75rem] bg-[#130b13] text-white">
        <div class="absolute -right-20 -top-24 size-80 rounded-full bg-[#ec0016]/30 blur-3xl" />
        <div class="absolute -bottom-28 -left-16 size-72 rounded-full bg-[#0b4697]/45 blur-3xl" />
        <div class="relative z-10 grid min-h-[420px] sm:grid-cols-[1fr_.82fr]">
          <div class="flex flex-col justify-center p-7 sm:p-9">
            <p class="eyebrow !text-[#ff7180]">In development</p>
            <h2 class="mt-3 text-3xl font-black tracking-[-.045em]">Resin Series</h2>
            <p class="mt-4 text-sm leading-7 text-slate-300">Lini berikutnya untuk detail permukaan lebih halus, bentuk kompleks, dan rilisan kolektor yang lebih ekspresif.</p>
            <ul class="mt-6 grid gap-2 text-xs font-bold text-slate-200">
              <li><CheckCircle :size="17" weight="fill" />Sharper micro details</li>
              <li><CheckCircle :size="17" weight="fill" />Collector-focused finish</li>
              <li><CheckCircle :size="17" weight="fill" />Sedang dalam pengembangan</li>
            </ul>
            <NuxtLink to="/search" class="mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-black text-white backdrop-blur hover:bg-white/20">Ikuti rilisan <ArrowRight :size="16" /></NuxtLink>
          </div>
          <div class="relative hidden items-end justify-center overflow-hidden p-5 sm:flex">
            <div class="absolute inset-x-5 bottom-5 top-10 rotate-3 rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur" />
            <img :src="'/product-designer-buddy-v2.webp'" alt="Visual pengembangan karakter JWLAB" class="relative z-10 max-h-[355px] w-full -rotate-2 rounded-[1.5rem] object-cover object-top shadow-2xl" loading="lazy">
          </div>
        </div>
      </article>
    </section>

    <section v-if="data?.categories.length" class="container-shell pb-14 sm:pb-20">
      <div class="rounded-[1.75rem] border border-black/10 bg-white p-6 sm:p-9">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div><p class="eyebrow">Shop your way</p><h2 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Jelajahi berdasarkan koleksi</h2></div>
          <NuxtLink to="/search" class="text-xs font-black text-[#0b4697]">Buka katalog lengkap →</NuxtLink>
        </div>
        <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="(category, index) in data.categories" :key="category.id" :to="`/categories/${category.slug}`" class="group flex min-h-32 items-end justify-between overflow-hidden rounded-2xl p-5 text-white transition hover:-translate-y-1" :class="index % 3 === 0 ? 'bg-[#0b4697]' : index % 3 === 1 ? 'bg-[#ec0016]' : 'bg-[#111217]'">
            <span><span class="block text-[9px] font-bold uppercase tracking-[.16em] text-white/60">Collection {{ String(index + 1).padStart(2, "0") }}</span><strong class="mt-2 block text-xl font-black">{{ category.name }}</strong></span>
            <ArrowRight :size="22" class="transition group-hover:translate-x-1" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
