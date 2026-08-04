import { CheckCircle, QrCode, Truck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-4 border-[#e21b2d] bg-[#0b0c10] text-slate-300">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand-mark.svg"
              width={58}
              height={58}
              alt="JWLAB STUDIO"
              className="size-14 object-contain"
            />
            <div>
              <p className="font-black tracking-[-.02em] text-white">JWLAB STUDIO</p>
              <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[.22em] text-slate-500">Characters worth collecting</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            Figure berkarakter untuk rak, meja, dan ruang favoritmu. Dipilih, dicek, dan dikemas dengan standar kolektor.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-2">
              <CheckCircle size={16} className="text-[#ff4052]" /> Quality checked
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-2">
              <QrCode size={16} className="text-[#ff4052]" /> QRIS
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-2">
              <Truck size={16} className="text-[#ff4052]" /> Secure delivery
            </span>
          </div>
        </div>

        <div>
          <p className="footer-title">Belanja</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/search">Semua produk</Link>
            <Link href="/categories/figure-karakter">Figure karakter</Link>
            <Link href="/categories/chibi-mini-figure">Chibi & mini figure</Link>
            <Link href="/categories/designer-toys">Designer toys</Link>
          </div>
        </div>

        <div>
          <p className="footer-title">Bantuan</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/account/orders">Pesanan saya</Link>
            <Link href="/account/addresses">Alamat pengiriman</Link>
            <Link href="/cart">Keranjang</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} JWLAB STUDIO
      </div>
    </footer>
  );
}
