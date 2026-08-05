import {
  ArrowRight,
  Gauge,
  MapPin,
  Package,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,phone")
      .eq("id", user!.id)
      .single(),
    supabase.rpc("is_admin"),
  ]);

  return (
    <section className="container-shell py-10 sm:py-14">
      <div className="surface p-6 sm:p-9">
        <p className="eyebrow">{isAdmin ? "Admin toko" : "Akun saya"}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Halo, {profile?.full_name || user?.user_metadata.full_name || (isAdmin ? "Admin" : "Pelanggan")}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-500">{user?.email}</p>
              {isAdmin && (
                <span className="rounded-full bg-[#111217] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  Administrator
                </span>
              )}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="secondary" size="sm">
              <SignOut size={17} /> Keluar
            </Button>
          </form>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-3xl border border-[#1746a2]/20 bg-[#e8efff] p-6 transition hover:border-[#1746a2]/50 hover:shadow-lg md:col-span-2"
            >
              <Gauge size={30} className="text-[#1746a2]" />
              <h2 className="mt-5 font-black">Buka CMS Admin</h2>
              <p className="mt-2 text-sm text-slate-600">
                Kelola produk, upload gambar, stok, voucher, pesanan, dan integrasi toko.
              </p>
              <span className="mt-5 flex items-center gap-1 text-sm font-bold text-[#e21b2d]">
                Masuk dashboard <ArrowRight />
              </span>
            </Link>
          )}
          <Link href="/account/orders" className="rounded-3xl border border-slate-200 p-6 transition hover:border-[#1746a2]/40 hover:shadow-lg">
            <Package size={28} className="text-[#1746a2]" />
            <h2 className="mt-5 font-black">Pesanan & tracking</h2>
            <p className="mt-2 text-sm text-slate-500">Cek pembayaran, resi BCE, dan perjalanan paket.</p>
            <span className="mt-5 flex items-center gap-1 text-sm font-bold text-[#e21b2d]">Lihat pesanan <ArrowRight /></span>
          </Link>
          <Link href="/account/addresses" className="rounded-3xl border border-slate-200 p-6 transition hover:border-[#1746a2]/40 hover:shadow-lg">
            <MapPin size={28} className="text-[#1746a2]" />
            <h2 className="mt-5 font-black">Alamat pengiriman</h2>
            <p className="mt-2 text-sm text-slate-500">Kelola penerima, detail alamat, dan titik lokasi.</p>
            <span className="mt-5 flex items-center gap-1 text-sm font-bold text-[#e21b2d]">Kelola alamat <ArrowRight /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
