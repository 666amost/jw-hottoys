"use client";

import {
  CaretDown,
  Handbag,
  List,
  MagnifyingGlass,
  MapPin,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="bg-[#082f3d] px-4 py-2 text-center text-[11px] font-bold text-white sm:text-xs">
        <span className="text-[#f7b718]">ONGKIR Rp10.000</span>
        <span className="mx-2 text-white/30">•</span>
        Jakarta & Tangerang sampai 3 kg
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="container-shell flex h-19 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="JWLAB STUDIO — beranda">
            <Image
              src="/logo-jwlab-studio.png"
              width={62}
              height={62}
              alt="JWLAB STUDIO"
              priority
              className="size-13 object-contain sm:size-15"
            />
            <span className="ml-2 hidden text-sm font-black tracking-[.13em] text-[#082f3d] lg:block">
              JWLAB STUDIO
            </span>
          </Link>

          <form action="/search" className="relative mx-auto hidden w-full max-w-2xl md:block">
            <MagnifyingGlass
              size={19}
              weight="bold"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0d5772]"
            />
            <input
              name="q"
              aria-label="Cari produk"
              placeholder="Cari action figure, chibi, atau SKU..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-24 text-sm outline-none transition focus:border-[#0d5772] focus:bg-white focus:ring-4 focus:ring-[#eaf2f4]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-8 rounded-lg bg-[#082f3d] px-4 text-xs font-extrabold text-white hover:bg-[#0d5772]"
            >
              Cari
            </button>
          </form>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/addresses">
                <MapPin size={19} />
                <span className="hidden xl:inline">Alamat</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Akun">
              <Link href="/account">
                <UserCircle size={23} />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Keranjang">
              <Link href="/cart">
                <Handbag size={23} />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-[#e84b18] text-[10px] font-bold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </Button>
          </nav>

          <button
            type="button"
            className="ml-auto grid size-10 place-items-center rounded-xl hover:bg-[#eaf2f4] md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>

        <div className="container-shell pb-3 md:hidden">
          <form action="/search" className="relative">
            <MagnifyingGlass
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#0d5772]"
            />
            <input
              name="q"
              aria-label="Cari produk"
              placeholder="Cari action figure atau chibi..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-[#0d5772]"
            />
          </form>
        </div>

        <div className="hidden border-t border-slate-100 md:block">
          <div className="container-shell flex h-10 items-center gap-6 overflow-x-auto text-xs font-bold text-slate-600 hide-scrollbar">
            <Link
              href="/search"
              className="flex shrink-0 items-center gap-1 text-[#082f3d] hover:text-[#e84b18]"
            >
              Semua produk <CaretDown size={13} weight="bold" />
            </Link>
            <Link href="/categories/figure-karakter" className="shrink-0 hover:text-[#e84b18]">
              Figure Karakter
            </Link>
            <Link href="/categories/chibi-mini-figure" className="shrink-0 hover:text-[#e84b18]">
              Chibi & Mini Figure
            </Link>
            <Link href="/categories/designer-toys" className="shrink-0 hover:text-[#e84b18]">
              Designer Toys
            </Link>
            <Link href="/search" className="shrink-0 hover:text-[#e84b18]">
              Ready Stock
            </Link>
            <Link href="/search" className="shrink-0 text-[#e84b18]">
              Promo
            </Link>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-slate-400">
              <MapPin size={15} className="text-[#0d5772]" /> BCE Express
            </span>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-100 bg-white p-4 md:hidden">
            <div className="container-shell grid gap-1">
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/search">
                Semua produk
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
                href="/categories/figure-karakter"
              >
                Figure karakter
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
                href="/categories/chibi-mini-figure"
              >
                Chibi & mini figure
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
                href="/categories/designer-toys"
              >
                Designer toys
              </Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/cart">
                Keranjang ({itemCount})
              </Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/account">
                Akun & pesanan
              </Link>
              <Link
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
                href="/account/addresses"
              >
                Alamat pengiriman
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
