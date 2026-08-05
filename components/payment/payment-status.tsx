"use client";

import { ArrowRight, CircleNotch, Clock, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { QrisSuccessLottie } from "@/components/payment/qris-success-lottie";
import {
  getNextPaymentStatusPollDelay,
  getPaymentMonitoringDeadline,
  QRIS_MONITORING_WINDOW_MS,
} from "@/lib/payment-status-monitoring";
import { createClient } from "@/lib/supabase/client";

type PaymentState = "pending" | "paid" | "failed" | "expired" | "review";

type StatusResponse = {
  id: string;
  order_number: string;
  payment_status: PaymentState;
  payments?: { expires_at: string | null } | Array<{ expires_at: string | null }>;
  shipments?: Array<{ awb_number: string | null; status: string }>;
};

function getExpiresAt(status: StatusResponse) {
  const payments = status.payments;
  return Array.isArray(payments) ? payments[0]?.expires_at : payments?.expires_at;
}

function isTerminal(status: PaymentState) {
  return status !== "pending";
}

export function PaymentStatus({ orderNumber }: { orderNumber: string }) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [monitoringEnded, setMonitoringEnded] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const supabase = createClient();
    let active = true;
    let finished = false;
    let consecutiveCheckFailures = 0;
    let deadline = startedAt + QRIS_MONITORING_WINDOW_MS;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`payment-status:${orderNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          if (!active || finished) return;
          const updated = payload.new as Partial<StatusResponse>;
          if (!updated.payment_status) return;

          setStatus((current) =>
            current
              ? { ...current, payment_status: updated.payment_status as PaymentState }
              : updated.id && updated.order_number
                ? (updated as StatusResponse)
                : current,
          );
          consecutiveCheckFailures = 0;
          setConnectionIssue(false);
          finish(updated.payment_status as PaymentState);
        },
      )
      .subscribe((realtimeStatus: string) => {
        if (!active) return;
        if (realtimeStatus === "CHANNEL_ERROR" || realtimeStatus === "TIMED_OUT") {
          // Polling remains active, so a realtime interruption alone should not
          // be presented to the customer as a payment problem.
          scheduleFallbackCheck();
        }
      });

    function stopMonitoring() {
      if (timeout) clearTimeout(timeout);
      if (channel) void supabase.removeChannel(channel);
    }

    function finish(paymentStatus: PaymentState) {
      if (paymentStatus === "paid") clearCart();
      if (isTerminal(paymentStatus)) {
        finished = true;
        stopMonitoring();
      }
    }

    function scheduleFallbackCheck() {
      if (!active || finished) return;
      if (timeout) clearTimeout(timeout);
      const delay = getNextPaymentStatusPollDelay(Date.now(), deadline, startedAt);
      if (delay === null) {
        setMonitoringEnded(true);
        return;
      }
      timeout = setTimeout(checkStatus, delay);
    }

    async function checkStatus() {
      if (!active || finished) return;
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderNumber)}/payment-status`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error();
        const data = (await response.json()) as StatusResponse;
        if (!active || finished) return;

        deadline = getPaymentMonitoringDeadline(startedAt, getExpiresAt(data));
        consecutiveCheckFailures = 0;
        setStatus(data);
        setConnectionIssue(false);
        finish(data.payment_status);
        if (!isTerminal(data.payment_status)) scheduleFallbackCheck();
      } catch {
        if (!active || finished) return;
        consecutiveCheckFailures += 1;
        if (consecutiveCheckFailures >= 3) setConnectionIssue(true);
        scheduleFallbackCheck();
      }
    }

    void checkStatus();

    return () => {
      active = false;
      stopMonitoring();
    };
  }, [orderNumber, clearCart]);

  const paymentStatus = status?.payment_status ?? "pending";
  const awb = status?.shipments?.[0]?.awb_number;
  const paid = paymentStatus === "paid";
  const review = paymentStatus === "review";
  const terminalFailure = paymentStatus === "failed" || paymentStatus === "expired";
  const confirming = !paid && !review && !terminalFailure && !monitoringEnded;

  return (
    <div className="surface mx-auto max-w-xl p-7 text-center sm:p-10" aria-live="polite">
      {paid ? (
        <QrisSuccessLottie />
      ) : review || terminalFailure ? (
        <WarningCircle size={54} weight="fill" className="mx-auto text-amber-500" />
      ) : confirming ? (
        <CircleNotch size={54} weight="bold" className="mx-auto animate-spin text-[#1746a2]" />
      ) : (
        <Clock size={54} weight="fill" className="mx-auto text-[#1746a2]" />
      )}
      <p className="eyebrow mt-6">{status?.order_number ?? orderNumber}</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">
        {paid ? "Order diterima" : review ? "Pembayaran sedang ditinjau" : terminalFailure ? "Pembayaran tidak selesai" : monitoringEnded ? "Waktu QRIS selesai" : "Mengonfirmasi pembayaran"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        {paid
          ? awb
            ? `Pembayaran berhasil. Resi BCE Express Anda: ${awb}`
            : "Pembayaran berhasil. Pesanan sudah diterima dan tercatat di akun Anda."
          : review
            ? "Pembayaran diterima di luar kondisi normal dan perlu pemeriksaan admin. Stok tidak akan dipotong dua kali."
            : terminalFailure
              ? "Reservasi stok telah dilepas. Anda dapat melakukan checkout ulang."
              : monitoringEnded
                ? "Pemantauan otomatis berhenti setelah 30 menit. Muat ulang detail pesanan jika Anda sudah membayar."
                : status
                  ? "Pembayaran sedang dicocokkan dengan konfirmasi QRIS. Halaman ini akan diperbarui otomatis."
                  : "Tunggu sebentar, kami sedang mengambil status pembayaran terbaru."}
      </p>
      {connectionIssue && !monitoringEnded && <p className="mt-4 text-xs font-semibold text-amber-700">Status belum dapat diperbarui. Kami akan mencoba lagi secara otomatis.</p>}
      <Button asChild className="mt-7">
        <Link href={status?.id ? `/account/orders/${status.id}` : "/account/orders"}>
          Lihat detail pesanan <ArrowRight size={18} />
        </Link>
      </Button>
    </div>
  );
}
