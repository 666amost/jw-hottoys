"use client";

import { ArrowRight, MapPin, ShieldCheck, Truck } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { calculateCartShipping } from "@/lib/domain/shipping";
import { formatCurrency } from "@/lib/format";

type CheckoutAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  district: string;
  city: string;
  postal_code: string;
  is_default: boolean;
};

export function CheckoutForm({ addresses }: { addresses: CheckoutAddress[] }) {
  const { lines, subtotal } = useCart();
  const [addressId, setAddressId] = useState(
    addresses.find((address) => address.is_default)?.id ?? addresses[0]?.id ?? "",
  );
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shipping = useMemo(() => calculateCartShipping(lines), [lines]);

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          voucherCode: voucherCode || null,
          lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message ?? "Checkout gagal.");
      window.location.assign(result.payment_url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout gagal.");
      setLoading(false);
    }
  }

  if (!lines.length) {
    return (
      <div className="surface mx-auto max-w-xl p-10 text-center">
        <h1 className="text-2xl font-black">Keranjang kosong</h1>
        <p className="mt-2 text-sm text-slate-500">Pilih produk sebelum melanjutkan checkout.</p>
        <Button asChild className="mt-6"><Link href="/search">Lihat koleksi</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_390px]">
      <div className="grid gap-6">
        <section className="surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Langkah 1</p>
              <h1 className="mt-2 text-2xl font-black">Alamat pengiriman</h1>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/account/addresses/new"><MapPin size={17} /> Tambah alamat</Link>
            </Button>
          </div>
          {addresses.length ? (
            <div className="mt-6 grid gap-3">
              {addresses.map((address) => (
                <label key={address.id} className="flex cursor-pointer gap-4 rounded-2xl border border-slate-200 p-5 has-[:checked]:border-[#1746a2] has-[:checked]:bg-[#e8efff]">
                  <input type="radio" name="address" value={address.id} checked={addressId === address.id} onChange={() => setAddressId(address.id)} className="mt-1 size-4 accent-[#1746a2]" />
                  <span>
                    <span className="font-black">{address.label}</span>
                    <span className="mt-1 block text-sm font-semibold">{address.recipient_name} · {address.phone}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">{address.address_line}, {address.district}, {address.city} {address.postal_code}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
              Tambahkan alamat Jakarta atau Tangerang sebelum checkout.
            </div>
          )}
        </section>

        <section className="surface p-6 sm:p-8">
          <p className="eyebrow">Langkah 2</p>
          <h2 className="mt-2 text-2xl font-black">Voucher produk</h2>
          <p className="mt-2 text-sm text-slate-500">Voucher tidak mengurangi promo ongkir otomatis.</p>
          <input value={voucherCode} onChange={(event) => setVoucherCode(event.target.value.toUpperCase())} className="field mt-5 max-w-sm uppercase" placeholder="Masukkan kode voucher" maxLength={32} />
        </section>
      </div>

      <aside className="surface sticky top-24 p-6">
        <h2 className="text-lg font-black">Ringkasan pembayaran</h2>
        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between text-slate-600"><dt>Produk ({lines.reduce((n, line) => n + line.quantity, 0)})</dt><dd className="font-semibold text-slate-900">{formatCurrency(subtotal)}</dd></div>
          <div className="flex justify-between text-slate-600"><dt>Berat tagihan</dt><dd className="font-semibold text-slate-900">{shipping.billableWeightKg} kg</dd></div>
          <div className="flex items-start justify-between"><dt className="text-slate-600">Ongkir BCE</dt><dd className="text-right">
            {shipping.discountAmount > 0 && <span className="mr-2 text-xs text-slate-400 line-through">{formatCurrency(shipping.referenceAmount)}</span>}
            <span className="font-bold text-[#e21b2d]">{formatCurrency(shipping.chargedAmount)}</span>
            {shipping.discountAmount > 0 && <span className="block text-[10px] font-bold text-emerald-600">Hemat {formatCurrency(shipping.discountAmount)}</span>}
          </dd></div>
        </dl>
        <div className="my-5 border-t border-dashed border-slate-200" />
        <div className="flex items-end justify-between"><span className="text-sm font-semibold text-slate-600">Total sementara</span><strong className="text-xl">{formatCurrency(subtotal + shipping.chargedAmount)}</strong></div>
        <p className="mt-3 text-[11px] leading-5 text-slate-400">Server akan menghitung ulang harga, stok, voucher, berat, coverage, dan ongkir sebelum membuat QRIS.</p>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
        <Button size="lg" className="mt-6 w-full" disabled={!addressId || loading} onClick={checkout}>
          {loading ? "Menyiapkan QRIS..." : "Bayar dengan QRIS"} <ArrowRight size={18} />
        </Button>
        <div className="mt-5 grid gap-3 text-xs text-slate-500">
          <p className="flex gap-2"><ShieldCheck size={17} className="shrink-0 text-emerald-600" /> Status lunas hanya dari webhook terverifikasi</p>
          <p className="flex gap-2"><Truck size={17} className="shrink-0 text-[#1746a2]" /> AWB dibuat otomatis setelah pembayaran</p>
        </div>
      </aside>
    </div>
  );
}
