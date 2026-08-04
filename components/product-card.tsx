import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const price = product.variant.salePrice ?? product.variant.regularPrice;
  const stock = Math.max(0, product.variant.stockOnHand - product.variant.reservedStock);
  const discount = product.variant.salePrice
    ? Math.round((1 - product.variant.salePrice / product.variant.regularPrice) * 100)
    : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-black/25 hover:shadow-[0_22px_60px_rgba(17,18,23,.12)]">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[#f0f0ec]"
      >
        <Image
          src={product.images[0] || "/product-placeholder.svg"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 transition duration-500 group-hover:scale-[1.055] sm:p-3"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
          {product.variant.salePrice && (
            <span className="bg-[#e21b2d] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm sm:text-[10px]">
              -{discount}%
            </span>
          )}
          {stock <= 3 && stock > 0 && (
            <span className="bg-[#111217] px-2 py-1 text-[9px] font-bold text-white sm:text-[10px]">
              Sisa {stock}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col border-t border-black/8 p-3.5 sm:p-4">
        <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#1746a2] sm:text-[10px]">
          {product.category.name}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-snug tracking-[-.02em] text-[#111217] group-hover:text-[#e21b2d] sm:min-h-11 sm:text-base"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-1 text-[10px] font-medium text-slate-400 sm:text-[11px]">
          {product.shortDescription}
        </p>

        <div className="mt-3">
          {product.variant.salePrice && (
            <p className="text-[10px] text-slate-400 line-through sm:text-[11px]">
              {formatCurrency(product.variant.regularPrice)}
            </p>
          )}
          <p className="text-sm font-black text-[#111217] sm:text-base">{formatCurrency(price)}</p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-3 text-[10px] font-semibold text-slate-500 sm:mt-auto sm:text-xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle size={15} weight="fill" className="text-emerald-600" />
            Ready stock
          </span>
          <span className="grid size-7 place-items-center bg-[#111217] text-white transition group-hover:translate-x-0.5 group-hover:bg-[#e21b2d]">
            <ArrowRight size={14} weight="bold" />
          </span>
        </div>
      </div>
    </article>
  );
}
