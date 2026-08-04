import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-shell py-24 text-center">
      <p className="text-7xl font-black tracking-tighter text-[#e21b2d]">404</p>
      <h1 className="mt-5 text-2xl font-black">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500">Koleksi atau halaman yang Anda cari sudah tidak tersedia.</p>
      <Button asChild className="mt-7"><Link href="/">Kembali ke beranda</Link></Button>
    </div>
  );
}
