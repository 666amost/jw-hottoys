"use client";

import { ArrowRight, CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

type StatusResponse = {
  id: string;
  order_number: string;
  payment_status: "pending" | "paid" | "failed" | "expired" | "review";
  shipments?: Array<{ awb_number: string | null; status: string }>;
};

export function PaymentStatus({ orderNumber }: { orderNumber: string }) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    async function check() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment-status`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as StatusResponse;
        if (!active) return;
        setStatus(data);
        if (data.payment_status === "paid") clearCart();
        if (data.payment_status === "pending" || (data.payment_status === "paid" && !data.shipments?.[0]?.awb_number)) {
          timeout = setTimeout(check, 3000);
        }
      } catch {
        if (active) {
          setFailed(true);
          timeout = setTimeout(check, 5000);
        }
      }
    }
    check();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [orderNumber, clearCart]);

  const paymentStatus = status?.payment_status ?? "pending";
  const awb = status?.shipments?.[0]?.awb_number;
  const paid = paymentStatus === "paid";
  const review = paymentStatus === "review";
  const terminalFailure = paymentStatus === "failed" || paymentStatus === "expired";

  return (
    <div className="surface mx-auto max-w-xl p-7 text-center sm:p-10">
      {paid ? <CheckCircle size={54} weight="fill" className="mx-auto text-emerald-500" /> : review || terminalFailure ? <WarningCircle size={54} weight="fill" className="mx-auto text-amber-500" /> : <Clock size={54} weight="fill" className="mx-auto text-[#0d5772]" />}
      <p className="eyebrow mt-6">{status?.order_number ?? orderNumber}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">
        {paid ? "Pembayaran terkonfirmasi" : review ? "Pembayaran sedang ditinjau" : terminalFailure ? "Pembayaran tidak selesai" : "Memeriksa pembayaran"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {paid
          ? awb
            ? `Resi BCE Express Anda: ${awb}`
            : "Pembayaran sudah aman. Sistem sedang membuat resi BCE Express, biasanya kurang dari dua menit."
          : review
            ? "Pembayaran diterima di luar kondisi normal dan perlu pemeriksaan admin. Stok tidak akan dipotong dua kali."
            : terminalFailure
              ? "Reservasi stok telah dilepas. Anda dapat melakukan checkout ulang."
              : "Status pembayaran sedang dikonfirmasi. Halaman akan diperbarui otomatis."}
      </p>
      {failed && <p className="mt-4 text-xs font-semibold text-amber-700">Koneksi status sempat terputus; kami mencoba lagi otomatis.</p>}
      <Button asChild className="mt-7">
        <Link href={status?.id ? `/account/orders/${status.id}` : "/account/orders"}>
          Lihat detail pesanan <ArrowRight size={18} />
        </Link>
      </Button>
    </div>
  );
}
