import {
  ArrowRight,
  CheckCircle,
  Package,
  ShieldCheck,
  Sparkle,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalog";

const categoryArtwork = [
  "/product-fighter-duo-v2.webp",
  "/product-ninja-chibi-v2.webp",
  "/product-designer-buddy-v2.webp",
];

const collectorValues = [
  {
    icon: Sparkle,
    title: "Karakter yang kuat",
    text: "Setiap figure dipilih karena pose, siluet, dan ekspresinya.",
  },
  {
    icon: ShieldCheck,
    title: "Dicek satu per satu",
    text: "Kondisi visual diperiksa sebelum masuk ke packing.",
  },
  {
    icon: Package,
    title: "Collector-safe packing",
    text: "Dikemas berlapis agar aman sampai ke rak koleksimu.",
  },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <section className="container-shell py-3 sm:py-5">
        <div className="shelf-shadow relative isolate min-h-[690px] overflow-hidden rounded-[1.35rem] bg-[#0b0c10] text-white sm:min-h-[620px] lg:min-h-[650px]">
          <Image
            src="/hero-collectible-universe-v3.webp"
            alt="Lima karakter figure orisinal dalam display koleksi premium"
            fill
            priority
            unoptimized
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[80%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,13,.99)_0%,rgba(8,9,13,.94)_35%,rgba(8,9,13,.42)_63%,rgba(8,9,13,.08)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(8,9,13,.03)_0%,rgba(8,9,13,.1)_36%,rgba(8,9,13,.91)_63%,rgba(8,9,13,1)_100%)]" />
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#e21b2d]" />
          <div className="absolute right-5 top-5 hidden border-r border-t border-white/25 pr-4 pt-3 text-right text-[9px] font-black uppercase tracking-[.2em] text-white/65 sm:block">
            Drop 01<br />Original series
          </div>

          <div className="relative flex min-h-[690px] items-end px-6 pb-9 pt-10 sm:min-h-[620px] sm:items-center sm:px-11 sm:py-16 lg:min-h-[650px] lg:px-16">
            <div className="max-w-[660px]">
              <div className="release-tag">
                <span className="size-2 rounded-full bg-[#ff4052] shadow-[0_0_16px_rgba(255,64,82,.9)]" />
                New collectible universe
              </div>
              <h1 className="display-title mt-6 max-w-[650px]">
                Figure buat  <span className="block text-[#ff4052] sm:inline">Penghobi.</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-slate-300 sm:text-lg sm:leading-8">
                Temukan figure orisinal dengan pose ikonik, detail menarik, dan kepribadian yang siap menghidupkan ruangmu.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/search">
                    Jelajahi koleksi <ArrowRight size={20} weight="bold" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/8 text-white hover:border-white/40 hover:bg-white/14"
                >
                  <Link href="#rilisan">Lihat rilisan terbaru</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400 sm:text-[11px]">
                <span className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-[#ff4052]" /> Ready stock
                </span>
                <span className="flex items-center gap-2">
                  <Sparkle size={16} weight="fill" className="text-[#ff4052]" /> Display ready
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="fill" className="text-[#ff4052]" /> Secure packing
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-black/10 bg-white">
        <div className="container-shell grid h-12 grid-cols-2 items-center text-[9px] font-black uppercase tracking-[.16em] text-[#111217] sm:grid-cols-4 sm:text-[10px]">
          {["Original characters", "Bold display", "Ready stock", "Collector safe"].map(
            (label, index) => (
              <span
                key={label}
                className={`${index > 1 ? "hidden sm:flex" : "flex"} min-w-0 items-center justify-center gap-3 whitespace-nowrap`}
              >
                {index > 0 && <span className="size-1.5 shrink-0 rotate-45 bg-[#e21b2d]" />}
                {label}
              </span>
            ),
          )}
        </div>
      </div>

      <section className="container-shell py-10 sm:py-14">
        <div className="grid border border-black/10 bg-white sm:grid-cols-3">
          {collectorValues.map((benefit, index) => (
            <div
              key={benefit.title}
              className={[
                "flex gap-4 p-5 sm:p-6",
                index ? "border-t border-black/10 sm:border-l sm:border-t-0" : "",
              ].join(" ")}
            >
              <span className="grid size-11 shrink-0 place-items-center bg-[#111217] text-white">
                <benefit.icon size={22} weight="duotone" />
              </span>
              <div>
                <h2 className="text-sm font-black text-[#111217]">{benefit.title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-8 sm:py-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Choose your world</p>
            <h2 className="section-title mt-3 text-[#111217]">Temukan gaya koleksimu.</h2>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#1746a2] hover:text-[#e21b2d] sm:flex"
          >
            Semua koleksi <ArrowRight size={17} weight="bold" />
          </Link>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative min-h-72 overflow-hidden border border-black/10 bg-[#ecece8]"
            >
              <div className="absolute inset-y-0 right-0 w-[66%]">
                <Image
                  src={categoryArtwork[index] || categoryArtwork[0]}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 66vw, 22vw"
                  className="object-contain p-2 transition duration-500 group-hover:scale-[1.06]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white from-38% via-white/88 via-55% to-white/5" />
              <div className="absolute left-0 top-0 grid size-12 place-items-center bg-[#111217] text-xs font-black text-white">
                0{index + 1}
              </div>
              <div className="relative flex min-h-72 max-w-[60%] flex-col justify-end p-6 sm:p-7">
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#e21b2d]">Collection</p>
                <h3 className="mt-2 text-2xl font-black leading-[.98] tracking-[-.045em] text-[#111217]">
                  {category.name}
                </h3>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                  {category.description}
                </p>
                <span className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-[#1746a2]">
                  Explore <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="rilisan" className="container-shell scroll-mt-36 py-10 sm:py-14">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Latest drop</p>
            <h2 className="section-title mt-3 text-[#111217]">Rilisan yang sedang disorot.</h2>
          </div>
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/search">
              Lihat semua <ArrowRight size={17} />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-16">
        <div className="brand-grid relative overflow-hidden bg-[#111217] text-white">
          <div className="absolute -right-20 -top-24 size-80 rounded-full bg-[#1746a2] opacity-35 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-2 w-full bg-[linear-gradient(90deg,#e21b2d_0_58%,#1746a2_58%_82%,#ffc400_82%)]" />

          <div className="relative grid gap-9 px-6 py-10 sm:px-10 sm:py-13 lg:grid-cols-[1fr_420px] lg:items-center lg:px-14">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff4052]">
                Collector delivery
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-[.96] tracking-[-.055em] sm:text-5xl">
                Lebih banyak karakter. Ongkir tetap ringan.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Flat Rp10.000 sampai 3 kg untuk Jakarta dan Tangerang. Otomatis dihitung saat checkout.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href="/search">
                  Mulai koleksi <ArrowRight size={20} weight="bold" />
                </Link>
              </Button>
            </div>

            <div className="border border-white/15 bg-black/25">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="flex items-center gap-2 text-sm font-black">
                  <Truck size={20} className="text-[#ff4052]" /> Shipping guide
                </span>
                <span className="bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-white">
                  Jakarta & Tangerang
                </span>
              </div>
              <div className="divide-y divide-white/8 px-5 text-sm">
                {["1 kg", "2 kg", "3 kg"].map((weight) => (
                  <div key={weight} className="flex items-center justify-between py-4">
                    <span className="font-bold text-slate-400">Up to {weight}</span>
                    <span className="font-black text-white">Rp10.000</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
