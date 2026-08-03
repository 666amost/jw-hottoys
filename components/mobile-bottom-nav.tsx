"use client";

import {
  Handbag,
  House,
  Package,
  SquaresFour,
  UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: House, match: (path: string) => path === "/" },
  {
    href: "/search",
    label: "Katalog",
    icon: SquaresFour,
    match: (path: string) =>
      path.startsWith("/search") ||
      path.startsWith("/categories") ||
      path.startsWith("/products"),
  },
  { href: "/cart", label: "Keranjang", icon: Handbag, match: (path: string) => path === "/cart" },
  {
    href: "/account/orders",
    label: "Pesanan",
    icon: Package,
    match: (path: string) => path.startsWith("/account/orders"),
  },
  {
    href: "/account",
    label: "Akun",
    icon: UserCircle,
    match: (path: string) =>
      path.startsWith("/account") && !path.startsWith("/account/orders"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/96 shadow-[0_-10px_35px_rgba(8,47,61,.1)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold transition",
                active ? "text-[#0d5772]" : "text-slate-400 hover:text-[#082f3d]",
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[#f7b718]" />
              )}
              <span className="relative">
                <Icon size={23} weight={active ? "fill" : "regular"} />
                {item.href === "/cart" && itemCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 grid min-w-4.5 place-items-center rounded-full bg-[#e84b18] px-1 text-[9px] font-black leading-[18px] text-white ring-2 ring-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
