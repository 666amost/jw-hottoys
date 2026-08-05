import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCategories, searchProducts } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await getCategories()).find((item) => item.slug === slug);
  return { title: category?.name ?? "Kategori" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await getCategories()).find((item) => item.slug === slug);
  if (!category) notFound();
  const products = await searchProducts("", slug);

  return (
    <section className="container-shell py-8 sm:py-12">
      <Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#e21b2d]">
        <ArrowLeft size={17} /> Semua koleksi
      </Link>
      <div className="brand-grid relative mt-7 overflow-hidden bg-[#111217] px-6 py-9 text-white sm:px-10 sm:py-12">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#e21b2d]" />
        <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff4052]">Collection archive</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{category.description}</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
