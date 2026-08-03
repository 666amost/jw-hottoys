"use client";

import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBagOpen,
  Trash,
  Truck,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { calculateCartShipping } from "@/lib/domain/shipping";
import { formatCurrency } from "@/lib/format";

export function CartView() {
  const { lines, subtotal, setQuantity, removeLine } = useCart();
  const shipping = calculateCartShipping(lines);

  if (!lines.length) {
    return (
      <div className="surface mx-auto grid max-w-2xl place-items-center px-6 py-20 text-center">
        <div className="grid size-18 place-items-center rounded-full bg-[#eaf2f4] text-[#0d5772]">
          <ShoppingBagOpen size={34} />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight">Keranjang masih kosong</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Temukan action figure yang cocok untuk koleksi Anda.
        </p>
        <Button asChild className="mt-7">
          <Link href="/search">Jelajahi koleksi <ArrowRight size={18} /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_390px]">
      <section className="surface overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <h1 className="text-xl font-black tracking-tight">Keranjang Anda</h1>
          <p className="mt-1 text-sm text-slate-500">{lines.length} jenis koleksi dipilih</p>
        </div>
        <div className="divide-y divide-slate-100">
          {lines.map((line) => (
            <article key={line.variantId} className="grid grid-cols-[92px_1fr] gap-4 p-5 sm:grid-cols-[120px_1fr_auto] sm:p-7">
              <Link href={`/products/${line.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-100">
                <Image src={line.image} alt={line.name} fill sizes="120px" className="object-cover" />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#e84b18]">{line.sku}</p>
                <Link href={`/products/${line.slug}`} className="mt-1 block font-bold leading-snug text-slate-900 hover:text-[#0d5772]">
                  {line.name}
                </Link>
                <p className="mt-2 font-black">{formatCurrency(line.unitPrice)}</p>
                {line.regularPrice > line.unitPrice && (
                  <p className="text-xs text-slate-400 line-through">{formatCurrency(line.regularPrice)}</p>
                )}
                <div className="mt-4 flex w-32 items-center justify-between rounded-full border border-slate-200 p-1 sm:hidden">
                  <button onClick={() => setQuantity(line.variantId, line.quantity - 1)} className="grid size-8 place-items-center" aria-label="Kurangi">
                    <Minus size={15} />
                  </button>
                  <span className="text-sm font-bold">{line.quantity}</span>
                  <button onClick={() => setQuantity(line.variantId, line.quantity + 1)} className="grid size-8 place-items-center" aria-label="Tambah">
                    <Plus size={15} />
                  </button>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end">
                <div className="hidden items-center rounded-full border border-slate-200 p-1 sm:flex">
                  <button onClick={() => setQuantity(line.variantId, line.quantity - 1)} className="grid size-8 place-items-center rounded-full hover:bg-slate-100" aria-label="Kurangi">
                    <Minus size={15} />
                  </button>
                  <span className="w-9 text-center text-sm font-bold">{line.quantity}</span>
                  <button onClick={() => setQuantity(line.variantId, line.quantity + 1)} className="grid size-8 place-items-center rounded-full hover:bg-slate-100" aria-label="Tambah">
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.variantId)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600"
                >
                  <Trash size={16} /> Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="surface sticky top-24 p-6">
        <h2 className="text-lg font-black">Ringkasan belanja</h2>
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-slate-900">{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>Berat tagihan</dt>
            <dd className="font-semibold text-slate-900">{shipping.billableWeightKg} kg</dd>
          </div>
          <div className="flex items-start justify-between">
            <dt className="text-slate-600">Estimasi ongkir</dt>
            <dd className="text-right">
              {shipping.discountAmount > 0 && (
                <span className="mr-2 text-xs text-slate-400 line-through">
                  {formatCurrency(shipping.referenceAmount)}
                </span>
              )}
              <span className="font-bold text-[#e84b18]">{formatCurrency(shipping.chargedAmount)}</span>
              {shipping.discountAmount > 0 && (
                <span className="mt-1 block text-[10px] font-bold text-emerald-600">
                  Hemat {formatCurrency(shipping.discountAmount)}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <div className="my-5 border-t border-dashed border-slate-200" />
        <div className="flex items-end justify-between">
          <p className="text-sm font-semibold text-slate-600">Estimasi total</p>
          <p className="text-xl font-black">{formatCurrency(subtotal + shipping.chargedAmount)}</p>
        </div>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/checkout">Lanjut checkout <ArrowRight size={19} /></Link>
        </Button>
        <div className="mt-5 grid gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /> Harga dan stok diverifikasi saat checkout</p>
          <p className="flex items-center gap-2"><Truck size={17} className="text-[#0d5772]" /> Pengiriman Jakarta/Tangerang via BCE Express</p>
        </div>
      </aside>
    </div>
  );
}
