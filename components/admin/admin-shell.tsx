"use client";

import {
  ArrowSquareOut,
  CaretRight,
  Gauge,
  List,
  Megaphone,
  Package,
  Percent,
  PlugsConnected,
  SignOut,
  Stack,
  Storefront,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    label: "Ringkasan",
    links: [{ href: "/admin", label: "Dashboard", icon: Gauge }],
  },
  {
    label: "Commerce",
    links: [
      { href: "/admin/products", label: "Produk", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Stack },
      { href: "/admin/orders", label: "Pesanan", icon: Storefront },
      { href: "/admin/vouchers", label: "Voucher", icon: Percent },
    ],
  },
  {
    label: "Website & layanan",
    links: [
      { href: "/admin/content", label: "Billboard", icon: Megaphone },
      { href: "/admin/integrations", label: "Integrasi BCE", icon: PlugsConnected },
    ],
  },
];

const allLinks = navigation.flatMap((section) => section.links);

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  displayName,
  email,
}: {
  children: React.ReactNode;
  displayName: string;
  email: string;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentPage = allLinks.find((item) => isActivePath(pathname, item.href))?.label ?? "Admin";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="admin-shell min-h-dvh bg-[#f4f6f8] text-slate-900">
      <button
        type="button"
        aria-label="Tutup navigasi"
        className={`fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] transition-opacity md:hidden ${sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden border-r border-slate-200 bg-[#fbfbfc] text-slate-600 shadow-2xl transition-transform duration-300 md:translate-x-0 md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200/80 px-6">
          <Image src="/brand-mark.svg" alt="JWLAB" width={44} height={44} className="size-10" priority />
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-tight text-slate-950">JWLAB STUDIO</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#d7192d]">Admin workspace</p>
          </div>
          <button type="button" className="ml-auto grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-scrollbar flex-1 overflow-y-auto px-4 py-5" aria-label="Navigasi admin">
          {navigation.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-400">{section.label}</p>
              <div className="grid gap-1">
                {section.links.map(({ href, label, icon: Icon }) => {
                  const active = isActivePath(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-[#fff0f2] text-[#c91425] ring-1 ring-inset ring-[#e21b2d]/10" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#e21b2d]" aria-hidden="true" />}
                      <Icon size={19} weight={active ? "fill" : "regular"} />
                      <span>{label}</span>
                      <CaretRight size={14} className={`ml-auto transition ${active ? "opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"}`} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200/80 p-4">
          <div className="mb-2 flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">{initials || "AD"}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">{email}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-700">
              <SignOut size={18} /> Keluar dari admin
            </button>
          </form>
        </div>
      </aside>

      <div className="min-h-dvh md:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" className="mr-3 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka navigasi" aria-expanded={sidebarOpen}>
            <List size={21} weight="bold" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Control room</p>
            <p className="text-sm font-black text-slate-900">{currentPage}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 sm:flex">
              Lihat toko <ArrowSquareOut size={16} />
            </Link>
            <span className="grid size-9 place-items-center rounded-full bg-[#111318] text-[11px] font-black text-white ring-4 ring-slate-100">{initials || "AD"}</span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1540px] p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
