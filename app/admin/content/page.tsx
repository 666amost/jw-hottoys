import { ArrowSquareOut, Info, Megaphone, Trash } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "../actions";

type AnnouncementRow = {
  id: string;
  label: string;
  message: string;
  href: string | null;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

type ContentPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function StatusMessage({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    const message =
      error === "schedule"
        ? "Jadwal tidak valid. Waktu selesai harus setelah waktu mulai."
        : error === "invalid"
          ? "Periksa kembali isi billboard. Tautan harus diawali /, http://, atau https://."
          : "Billboard belum dapat disimpan. Pastikan migration database terbaru sudah diterapkan.";
    return <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>;
  }

  if (saved) {
    return <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Perubahan billboard sudah diterbitkan.</p>;
  }

  return null;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const { error: errorParam, saved } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .select("id,label,message,href,active,sort_order,starts_at,ends_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const announcements = (data ?? []) as AnnouncementRow[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Konten global</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Billboard header</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Kelola pesan yang berganti otomatis di bagian paling atas website. Urutan kecil tampil lebih dulu.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/" target="_blank">
            Lihat website <ArrowSquareOut size={17} />
          </Link>
        </Button>
      </div>

      <StatusMessage error={errorParam ?? (error ? "database" : undefined)} saved={saved} />

      <form action={createAnnouncement} className="surface mt-7 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="grid size-10 place-items-center rounded-xl bg-red-50 text-[#e21b2d]"><Megaphone size={21} weight="fill" /></span>
          <div><h2 className="font-black">Tambah pesan</h2><p className="text-xs text-slate-500">Pesan aktif langsung masuk ke rotasi billboard.</p></div>
        </div>
        <label className="field-label">Label singkat<input className="field" name="label" maxLength={40} placeholder="Flat ongkir Rp10.000" required /></label>
        <label className="field-label sm:col-span-1 lg:col-span-2">Pesan utama<input className="field" name="message" maxLength={120} placeholder="Jakarta & Tangerang sampai 3 kg" required /></label>
        <label className="field-label">Tautan opsional<input className="field" name="href" maxLength={500} placeholder="/search" /></label>
        <label className="field-label">Mulai tayang (WIB)<input className="field" name="starts_at" type="datetime-local" /></label>
        <label className="field-label">Selesai tayang (WIB)<input className="field" name="ends_at" type="datetime-local" /></label>
        <label className="field-label">Urutan<input className="field" name="sort_order" type="number" min={0} max={100} defaultValue={10} required /></label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"><input name="active" type="checkbox" defaultChecked className="size-4 accent-[#e21b2d]" /> Aktifkan sekarang</label>
        <Button type="submit" className="sm:col-span-2 lg:col-span-4 lg:w-fit">Terbitkan billboard</Button>
      </form>

      <div className="mt-7 space-y-4">
        {announcements.length === 0 && !error && (
          <div className="surface flex items-start gap-3 p-5 text-sm text-slate-600"><Info size={20} className="mt-0.5 shrink-0 text-[#1746a2]" /><p>Belum ada billboard. Jika semua pesan dihapus atau dinonaktifkan, bar paling atas akan disembunyikan.</p></div>
        )}
        {announcements.map((item) => (
          <article key={item.id} className="surface p-5 lg:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`size-2.5 rounded-full ${item.active ? "bg-emerald-500" : "bg-slate-300"}`} />
                <div><h2 className="font-black">{item.label}</h2><p className="text-xs text-slate-500">{item.active ? "Aktif" : "Nonaktif"} · urutan {item.sort_order}</p></div>
              </div>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="danger" size="icon" aria-label={`Hapus ${item.label}`}><Trash size={18} /></Button>
              </form>
            </div>
            <form action={updateAnnouncement} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="id" value={item.id} />
              <label className="field-label">Label singkat<input className="field" name="label" maxLength={40} defaultValue={item.label} required /></label>
              <label className="field-label sm:col-span-1 lg:col-span-2">Pesan utama<input className="field" name="message" maxLength={120} defaultValue={item.message} required /></label>
              <label className="field-label">Tautan opsional<input className="field" name="href" maxLength={500} defaultValue={item.href ?? ""} /></label>
              <label className="field-label">Mulai tayang (WIB)<input className="field" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(item.starts_at)} /></label>
              <label className="field-label">Selesai tayang (WIB)<input className="field" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(item.ends_at)} /></label>
              <label className="field-label">Urutan<input className="field" name="sort_order" type="number" min={0} max={100} defaultValue={item.sort_order} required /></label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"><input name="active" type="checkbox" defaultChecked={item.active} className="size-4 accent-[#e21b2d]" /> Aktif</label>
              <Button type="submit" variant="secondary" className="sm:col-span-2 lg:col-span-4 lg:w-fit">Simpan perubahan</Button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
