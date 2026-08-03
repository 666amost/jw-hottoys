import { MapPin, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteAddress } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function AddressesPage() {
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at");

  return (
    <section className="container-shell py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pengiriman</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Alamat tersimpan</h1>
        </div>
        <Button asChild>
          <Link href="/account/addresses/new"><Plus size={18} /> Tambah alamat</Link>
        </Button>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {addresses?.map((address) => (
          <article key={address.id} className="surface p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-black"><MapPin className="text-[#0d5772]" /> {address.label}</p>
              {address.is_default && <span className="rounded-full bg-[#eaf2f4] px-3 py-1 text-[10px] font-bold text-[#0d5772]">UTAMA</span>}
            </div>
            <p className="mt-5 font-bold">{address.recipient_name} · {address.phone}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {address.address_line}, {address.subdistrict}, {address.district}, {address.city} {address.postal_code}
            </p>
            {address.landmark && <p className="mt-2 text-xs text-slate-400">Patokan: {address.landmark}</p>}
            <form action={deleteAddress} className="mt-5">
              <input type="hidden" name="id" value={address.id} />
              <Button variant="ghost" size="sm" className="text-red-600"><Trash size={16} /> Hapus</Button>
            </form>
          </article>
        ))}
        {!addresses?.length && (
          <div className="surface col-span-full px-6 py-16 text-center">
            <MapPin size={34} className="mx-auto text-slate-300" />
            <p className="mt-4 font-bold">Belum ada alamat pengiriman.</p>
          </div>
        )}
      </div>
    </section>
  );
}
