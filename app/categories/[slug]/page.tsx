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
      <Link href="/search" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#e84b18]">
        <ArrowLeft size={17} /> Semua koleksi
      </Link>
      <div className="brand-grid mt-7 rounded-3xl bg-[#082f3d] px-6 py-8 text-white sm:px-10 sm:py-11">
        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f7b718]">Kategori koleksi</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{category.description}</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
