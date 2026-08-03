import {
  ArrowRight,
  CheckCircle,
  Cube,
  Package,
  Ruler,
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

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <section className="container-shell py-3 sm:py-5">
        <div className="shelf-shadow brand-grid relative isolate min-h-[630px] overflow-hidden rounded-[1.75rem] bg-[#061f2a] text-white sm:min-h-[590px]">
          <Image
            src="/hero-3dprint-figures-v2.webp"
            alt="Koleksi action figure hasil 3D print di meja produksi"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover object-[70%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,23,31,.98)_0%,rgba(3,23,31,.93)_38%,rgba(3,23,31,.38)_70%,rgba(3,23,31,.06)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(3,23,31,.08)_0%,rgba(3,23,31,.26)_38%,rgba(3,23,31,.98)_68%,rgba(3,23,31,1)_100%)]" />
          <div className="absolute left-0 top-0 h-1.5 w-full bg-[linear-gradient(90deg,#f7b718_0_34%,#e84b18_34%_54%,#0d5772_54%)]" />

          <div className="relative flex min-h-[630px] items-end px-5 pb-8 pt-8 sm:min-h-[590px] sm:items-center sm:px-10 sm:py-14 lg:px-14">
            <div className="max-w-[620px]">
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f7b718] sm:text-xs">
                Action figure 3D print
              </p>
              <h1 className="mt-4 max-w-[600px] text-[clamp(2.55rem,6.2vw,5.1rem)] font-black leading-[.93] tracking-[-.058em]">
                Dicetak rapi.
                <span className="block text-[#f7b718]">Siap dikoleksi.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-200 sm:text-lg sm:leading-8">
                Figure PLA+ dengan ukuran jelas, warna menarik, dan harga yang mudah dijangkau.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/search">
                    Belanja sekarang <ArrowRight size={20} weight="bold" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/8 text-white hover:border-white/35 hover:bg-white/12"
                >
                  <Link href="#produk">Lihat produk</Link>
                </Button>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[11px] font-bold text-slate-300 sm:text-xs">
                <span className="flex items-center gap-1.5">
                  <Cube size={16} weight="fill" className="text-[#f7b718]" /> Material PLA+
                </span>
                <span className="flex items-center gap-1.5">
                  <Ruler size={16} weight="bold" className="text-[#f7b718]" /> Ukuran jelas
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={16} weight="fill" className="text-[#f7b718]" /> Ready stock
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell -mt-1 pb-7 pt-3 sm:pb-10">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_45px_rgba(8,47,61,.07)] sm:grid-cols-3">
          {[
            {
              icon: Ruler,
              title: "Spesifikasi jelas",
              text: "Bahan dan ukuran tercantum di produk.",
            },
            {
              icon: CheckCircle,
              title: "Dicek sebelum kirim",
              text: "Hasil cetak dan warna diperiksa.",
            },
            {
              icon: Package,
              title: "Packing aman",
              text: "Dikemas rapi dan dikirim via BCE.",
            },
          ].map((benefit, index) => (
            <div
              key={benefit.title}
              className={[
                "flex items-center gap-4 p-4 sm:p-5",
                index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : "",
              ].join(" ")}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf2f4] text-[#0d5772]">
                <benefit.icon size={23} weight="duotone" />
              </span>
              <div>
                <h2 className="text-sm font-black text-[#082f3d]">{benefit.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-8 sm:py-11">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Kategori</p>
            <h2 className="section-title mt-2 text-[#082f3d]">Pilih tipe figure</h2>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-2 text-sm font-extrabold text-[#0d5772] hover:text-[#e84b18] sm:flex"
          >
            Semua produk <ArrowRight size={17} weight="bold" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {categories.slice(0, 3).map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative min-h-56 overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="absolute inset-y-0 right-0 w-[58%]">
                <Image
                  src={categoryArtwork[index] || categoryArtwork[0]}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 58vw, 20vw"
                  className="object-contain p-3 transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-white from-45% via-white/88 via-62% to-white/5" />
              <div className="absolute left-0 top-0 h-1.5 w-full bg-[linear-gradient(90deg,#f7b718_0_44%,#e84b18_44%_58%,#0d5772_58%)]" />
              <div className="relative flex min-h-56 max-w-[58%] flex-col justify-end p-6">
                <h3 className="text-xl font-black leading-tight text-[#082f3d]">{category.name}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                  {category.description}
                </p>
                <span className="mt-4 flex items-center gap-2 text-xs font-extrabold text-[#0d5772]">
                  Lihat produk <ArrowRight size={16} weight="bold" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="produk" className="container-shell scroll-mt-36 py-9 sm:py-12">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">Ready stock</p>
            <h2 className="section-title mt-2 text-[#082f3d]">Produk pilihan</h2>
          </div>
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/search">
              Lihat semua <ArrowRight size={17} />
            </Link>
          </Button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="brand-grid relative overflow-hidden rounded-[1.75rem] bg-[#082f3d] text-white">
          <div className="absolute -right-20 -top-24 size-80 rounded-full bg-[#0d5772] opacity-55 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-[linear-gradient(90deg,#f7b718_0_48%,#e84b18_48%)]" />

          <div className="relative grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1fr_420px] lg:items-center lg:px-14">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f7b718]">
                Promo pengiriman
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-.045em] sm:text-5xl">
                Ongkir Rp10.000 sampai 3 kg.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Berlaku untuk Jakarta dan Tangerang. Diskon dihitung otomatis saat checkout.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href="/search">
                  Mulai belanja <ArrowRight size={20} weight="bold" />
                </Link>
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/12 bg-white/7 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="flex items-center gap-2 text-sm font-black">
                  <Truck size={20} className="text-[#f7b718]" /> Ongkir
                </span>
                <span className="rounded-lg bg-emerald-400/12 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300">
                  JAKARTA & TANGERANG
                </span>
              </div>
              <div className="divide-y divide-white/8 px-5 text-sm">
                {[
                  { weight: "1 kg", reference: null, charged: "Rp10.000" },
                  { weight: "2 kg", reference: "Rp20.000", charged: "Rp10.000" },
                  { weight: "3 kg", reference: "Rp30.000", charged: "Rp10.000" },
                ].map((row) => (
                  <div key={row.weight} className="flex items-center justify-between py-4">
                    <span className="font-bold text-slate-300">{row.weight}</span>
                    <span className="flex items-center gap-2">
                      {row.reference && (
                        <span className="text-xs text-slate-500 line-through">{row.reference}</span>
                      )}
                      <span className="font-black text-[#f7b718]">{row.charged}</span>
                    </span>
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
