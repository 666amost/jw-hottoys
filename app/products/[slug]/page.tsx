import {
  CheckCircle,
  Cube,
  Package,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";
import { serializeJsonLd } from "@/lib/utils";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const products = await getProducts();
  const related = products
    .filter((item) => item.id !== product.id && item.category.id === product.category.id)
    .slice(0, 4);
  const price = product.variant.salePrice ?? product.variant.regularPrice;
  const stock = Math.max(0, product.variant.stockOnHand - product.variant.reservedStock);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.variant.sku,
    image: product.images,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price,
      availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-shell py-7 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-[#e84b18]">Beranda</Link><span>/</span>
        <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link><span>/</span>
        <span className="text-[#082f3d]">{product.name}</span>
      </nav>

      <div className="grid items-start gap-7 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <section className="surface overflow-hidden border-[#0d5772]/15 bg-white">
          <div className="relative aspect-[4/5] bg-white">
            <Image
              src={product.images[0] || "/product-placeholder.svg"}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain p-3 sm:p-5"
            />
          </div>
        </section>

        <section className="lg:sticky lg:top-25">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{product.category.name}</p>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
              READY STOCK
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-black leading-[1.05] tracking-[-.045em] sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-500">{product.shortDescription}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#eaf2f4] px-3 py-2 text-xs font-extrabold text-[#0d5772]">
            <Cube size={17} weight="duotone" /> {product.variant.name}
          </p>
          <div className="mt-7">
            {product.variant.salePrice && (
              <p className="text-sm font-medium text-slate-400 line-through">
                {formatCurrency(product.variant.regularPrice)}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-black tracking-tight">{formatCurrency(price)}</p>
              {product.variant.salePrice && (
                <span className="rounded-lg bg-[#fff4d5] px-3 py-1 text-xs font-bold text-[#9a5b00]">
                  Hemat {formatCurrency(product.variant.regularPrice - product.variant.salePrice)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Stok tersedia</p>
              <p className="mt-1 font-black text-[#082f3d]">{stock} unit</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-500">Berat kirim</p>
              <p className="mt-1 font-black text-[#082f3d]">{product.variant.shippingWeightGrams} gram</p>
            </div>
          </div>

          <div className="mt-7">
            <AddToCart product={product} />
          </div>

          <div className="mt-7 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-sm">
            <p className="flex items-center gap-3"><ShieldCheck size={22} className="text-emerald-600" /> Produk dicek sebelum dikirim</p>
            <p className="flex items-center gap-3"><Package size={22} className="text-[#0d5772]" /> Packing berlapis dan aman</p>
            <p className="flex items-center gap-3"><Truck size={22} className="text-[#e84b18]" /> Ongkir Rp10.000 sampai 3 kg untuk Jakarta & Tangerang</p>
          </div>
        </section>
      </div>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="surface p-6 sm:p-9">
          <p className="eyebrow">Detail produk</p>
          <h2 className="mt-3 text-2xl font-black">Tentang produk</h2>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>
        </div>
        <aside className="surface p-6">
          <p className="font-black">Detail SKU</p>
          <dl className="mt-5 grid gap-4 text-sm">
            <div><dt className="text-xs text-slate-400">SKU</dt><dd className="mt-1 font-bold">{product.variant.sku}</dd></div>
            <div><dt className="text-xs text-slate-400">Edisi</dt><dd className="mt-1 font-bold">{product.variant.name}</dd></div>
            <div><dt className="text-xs text-slate-400">Kondisi</dt><dd className="mt-1 flex items-center gap-2 font-bold"><CheckCircle size={16} className="text-emerald-600" /> Baru</dd></div>
            <div><dt className="text-xs text-slate-400">Skala / tipe</dt><dd className="mt-1 flex items-center gap-2 font-bold"><Cube size={16} /> {product.variant.name}</dd></div>
          </dl>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <p className="eyebrow">Produk lainnya</p>
          <h2 className="section-title mt-3">Mungkin Anda suka</h2>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
