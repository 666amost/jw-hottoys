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
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import type { SiteAnnouncement } from "@/lib/types";

function AnnouncementBillboard({ announcements }: { announcements: SiteAnnouncement[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (announcements.length < 2 || reduceMotion) return;
    const interval = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % announcements.length),
      4800,
    );
    return () => window.clearInterval(interval);
  }, [announcements.length, reduceMotion]);

  if (announcements.length === 0) return null;
  const safeIndex = activeIndex % announcements.length;
  const active = announcements[safeIndex];
  const content = (
    <span className="billboard-enter flex min-w-0 items-center justify-center gap-2" key={active.id}>
      <span className="shrink-0 text-[#ff4052]">{active.label}</span>
      <span className="text-white/25" aria-hidden="true">•</span>
      <span className="truncate text-white/85">{active.message}</span>
    </span>
  );

  return (
    <div className="relative flex h-7 items-center overflow-hidden bg-[#111217] px-4 text-center text-[9px] font-extrabold uppercase tracking-[.11em] text-white sm:h-8 sm:text-[10px]">
      <div className="mx-auto min-w-0 max-w-[calc(100%-3.5rem)]">
        {active.href ? <Link href={active.href} className="block hover:text-white">{content}</Link> : content}
      </div>
      {announcements.length > 1 && (
        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1" aria-hidden="true">
          {announcements.map((item, index) => (
            <span key={item.id} className={`h-1 rounded-full transition-all ${index === safeIndex ? "w-3 bg-[#ff4052]" : "w-1 bg-white/30"}`} />
          ))}
        </span>
      )}
    </div>
  );
}

export function SiteHeader({ announcements }: { announcements: SiteAnnouncement[] }) {
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <AnnouncementBillboard announcements={announcements} />

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/96 backdrop-blur-xl">
        <div className="container-shell flex h-13 min-w-0 items-center gap-3 sm:h-18 sm:gap-5">
          <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="JWLAB STUDIO — beranda">
            <Image
              src="/brand-mark.svg"
              width={44}
              height={44}
              alt="JWLAB STUDIO"
              priority
              className="size-9 object-contain sm:size-11"
            />
            <span className="ml-2 block leading-none">
              <span className="block text-[13px] font-black tracking-[-.04em] text-[#111217] sm:text-sm">JWLAB</span>
              <span className="mt-1 block text-[7px] font-extrabold uppercase tracking-[.17em] text-slate-400 sm:text-[8px] sm:tracking-[.22em]">Collectible Studio</span>
            </span>
          </Link>

          <form action="/search" className="relative mx-auto hidden w-full max-w-2xl md:block">
            <MagnifyingGlass size={19} weight="bold" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1746a2]" />
            <input name="q" aria-label="Cari produk" placeholder="Cari action figure, chibi, atau SKU..." className="h-11 w-full rounded-lg border border-black/10 bg-[#f5f5f2] pl-11 pr-24 text-sm outline-none transition focus:border-[#1746a2] focus:bg-white focus:ring-4 focus:ring-[#e8efff]" />
            <button type="submit" className="absolute right-1.5 top-1.5 h-8 rounded-md bg-[#111217] px-4 text-xs font-extrabold text-white hover:bg-[#1746a2]">Cari</button>
          </form>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Button asChild variant="ghost" size="sm"><Link href="/account/addresses"><MapPin size={19} /><span className="hidden xl:inline">Alamat</span></Link></Button>
            <Button asChild variant="ghost" size="icon" aria-label="Akun"><Link href="/account"><UserCircle size={23} /></Link></Button>
            <Button asChild variant="ghost" size="icon" className="relative" aria-label="Keranjang">
              <Link href="/cart">
                <Handbag size={23} />
                {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-[#e21b2d] text-[10px] font-bold text-white">{itemCount > 99 ? "99+" : itemCount}</span>}
              </Link>
            </Button>
          </nav>

          <button type="button" className="ml-auto grid size-9 place-items-center rounded-lg hover:bg-black/5 md:hidden" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={23} /> : <List size={23} />}
          </button>
        </div>

        <div className="container-shell min-w-0 pb-2.5 md:hidden">
          <form action="/search" className="relative">
            <MagnifyingGlass size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1746a2]" />
            <input name="q" aria-label="Cari produk" placeholder="Cari action figure atau chibi..." className="h-9 w-full rounded-lg border border-black/10 bg-[#f5f5f2] pl-9 pr-4 text-[13px] outline-none focus:border-[#1746a2]" />
          </form>
        </div>

        <div className="hidden border-t border-black/8 md:block">
          <div className="container-shell flex h-10 items-center gap-7 overflow-x-auto text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-600 hide-scrollbar">
            <Link href="/search" className="flex shrink-0 items-center gap-1 text-[#111217] hover:text-[#e21b2d]">Koleksi <CaretDown size={13} weight="bold" /></Link>
            <Link href="/categories/figure-karakter" className="shrink-0 hover:text-[#e21b2d]">Figure Karakter</Link>
            <Link href="/categories/chibi-mini-figure" className="shrink-0 hover:text-[#e21b2d]">Chibi & Mini Figure</Link>
            <Link href="/categories/designer-toys" className="shrink-0 hover:text-[#e21b2d]">Designer Toys</Link>
            <Link href="/search" className="shrink-0 hover:text-[#e21b2d]">Rilisan terbaru</Link>
            <Link href="/search" className="shrink-0 text-[#e21b2d]">Promo</Link>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 text-slate-400"><MapPin size={15} className="text-[#1746a2]" /> Pengiriman BCE</span>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-100 bg-white p-4 md:hidden">
            <div className="container-shell grid gap-1">
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/search">Semua produk</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/categories/figure-karakter">Figure karakter</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/categories/chibi-mini-figure">Chibi & mini figure</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/categories/designer-toys">Designer toys</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/cart">Keranjang ({itemCount})</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/account">Akun & pesanan</Link>
              <Link onClick={() => setMenuOpen(false)} className="mobile-nav-link" href="/account/addresses">Alamat pengiriman</Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
