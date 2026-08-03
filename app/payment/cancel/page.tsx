import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return (
    <section className="container-shell py-16">
      <div className="surface mx-auto max-w-lg p-9 text-center">
        <h1 className="text-3xl font-black">Pembayaran dibatalkan</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Jika QRIS belum dibayar, order akan kedaluwarsa dan reservasi stok dilepas otomatis.
        </p>
        <Button asChild className="mt-7"><Link href="/account/orders">Lihat pesanan</Link></Button>
      </div>
    </section>
  );
}

