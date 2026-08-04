import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/components/product-card";
import { getCategories, searchProducts } from "@/lib/catalog";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export const metadata = { title: "Katalog" };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", category = "" } = await searchParams;
  const [products, categories] = await Promise.all([
    searchProducts(q, category),
    getCategories(),
  ]);

  return (
    <div className="container-shell py-8 sm:py-12">
      <div className="brand-grid relative overflow-hidden bg-[#111217] px-6 py-9 text-white sm:px-10 sm:py-12">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#e21b2d]" />
        <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#ff4052]">Full collection</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Temukan karakter favoritmu.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Jelajahi figure karakter, chibi, dan designer toys untuk melengkapi display koleksimu.</p>
      </div>
      <form className="-mt-4 mx-3 relative z-10 flex flex-col gap-3 border border-black/10 bg-white p-3 shadow-[0_15px_50px_rgba(17,18,23,.12)] sm:mx-8 sm:flex-row" action="/search">
        <label className="relative flex-1">
          <MagnifyingGlass size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="field border-0 bg-slate-50 pl-11 focus:bg-white" name="q" defaultValue={q} placeholder="Nama produk, karakter, atau SKU" />
        </label>
        <select className="field sm:w-56" name="category" defaultValue={category}>
          <option value="">Semua kategori</option>
          {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
        <button className="h-11 rounded-lg bg-[#e21b2d] px-6 text-sm font-extrabold text-white hover:bg-[#c91425]">
          Cari
        </button>
      </form>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-bold text-slate-900">{products.length}</span> produk ditemukan
          {q && <> untuk “{q}”</>}
        </p>
      </div>

      {products.length ? (
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="mt-8 border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="font-bold">Produk tidak ditemukan</p>
          <p className="mt-2 text-sm text-slate-500">Coba kata kunci atau kategori yang berbeda.</p>
        </div>
      )}
    </div>
  );
}
