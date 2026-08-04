import "leaflet/dist/leaflet.css";

import { AddressRegionFields } from "@/components/address/address-region-fields";
import { LocationPicker } from "@/components/address/location-picker";
import { Button } from "@/components/ui/button";
import { saveAddress } from "../actions";

export default async function NewAddressPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <section className="container-shell py-10 sm:py-14">
      <form action={saveAddress} className="surface mx-auto max-w-3xl p-6 sm:p-9">
        <p className="eyebrow">Alamat baru</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Detail penerima</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Saat ini pengiriman hanya melayani Jakarta dan Tangerang. Pin membantu kurir menemukan lokasi; ongkir tetap dihitung dari kota.
        </p>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Data belum dapat disimpan. Periksa seluruh field dan titik lokasi.</p>}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="field-label">Label alamat<input className="field" name="label" placeholder="Rumah / Kantor" required /></label>
          <label className="field-label">Nama penerima<input className="field" name="recipient_name" required /></label>
          <label className="field-label">Nomor telepon<input className="field" name="phone" inputMode="tel" placeholder="0812..." required /></label>
          <AddressRegionFields />
          <label className="field-label">Kode pos<input className="field" name="postal_code" inputMode="numeric" maxLength={5} required /></label>
          <label className="field-label sm:col-span-2">Alamat lengkap<textarea className="field min-h-28 resize-y" name="address_line" placeholder="Jalan, nomor, RT/RW, gedung/unit" required /></label>
          <label className="field-label sm:col-span-2">Patokan<textarea className="field min-h-20 resize-y" name="landmark" placeholder="Contoh: pagar hitam di sebelah minimarket" /></label>
          <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="is_default" defaultChecked className="size-4 accent-[#1746a2]" /> Jadikan alamat utama</label>
        </div>
        <div className="mt-8">
          <p className="mb-3 text-sm font-black">Titik lokasi</p>
          <LocationPicker />
        </div>
        <Button type="submit" size="lg" className="mt-8 w-full sm:w-auto">Simpan alamat</Button>
      </form>
    </section>
  );
}
