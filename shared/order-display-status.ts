import type { OrderStatus, PaymentStatus, ShipmentStatus } from "./types";

export type DisplayStatusKey =
  | "awaiting_payment"
  | "payment_review"
  | "payment_failed"
  | "payment_expired"
  | "paid"
  | "processing"
  | "pending_awb"
  | "awb_created"
  | "picked_up"
  | "in_transit"
  | "fulfilled"
  | "exception"
  | "cancelled";

export type OrderDisplayStatus = {
  key: DisplayStatusKey;
  label: string;
  detail: string;
};

type DisplayStatusInput = {
  orderStatus?: OrderStatus | string | null;
  paymentStatus?: PaymentStatus | string | null;
  shipmentStatus?: ShipmentStatus | string | null;
};

const statuses: Record<DisplayStatusKey, OrderDisplayStatus> = {
  awaiting_payment: { key: "awaiting_payment", label: "Menunggu pembayaran", detail: "Pembayaran belum diselesaikan" },
  payment_review: { key: "payment_review", label: "Perlu verifikasi", detail: "Pembayaran sedang diperiksa" },
  payment_failed: { key: "payment_failed", label: "Pembayaran gagal", detail: "Pembayaran tidak berhasil" },
  payment_expired: { key: "payment_expired", label: "Pembayaran kedaluwarsa", detail: "Batas waktu pembayaran telah berakhir" },
  paid: { key: "paid", label: "Sudah dibayar", detail: "Pembayaran telah terverifikasi" },
  processing: { key: "processing", label: "Sedang diproses", detail: "Pesanan sedang disiapkan" },
  pending_awb: { key: "pending_awb", label: "Menyiapkan pengiriman", detail: "Resi sedang dipersiapkan" },
  awb_created: { key: "awb_created", label: "Resi dibuat", detail: "Paket menunggu diserahkan ke kurir" },
  picked_up: { key: "picked_up", label: "Paket dijemput", detail: "Paket telah diterima kurir" },
  in_transit: { key: "in_transit", label: "Dalam perjalanan", detail: "Paket sedang menuju alamat penerima" },
  fulfilled: { key: "fulfilled", label: "Selesai", detail: "Paket diterima" },
  exception: { key: "exception", label: "Kendala pengiriman", detail: "Pengiriman memerlukan penanganan" },
  cancelled: { key: "cancelled", label: "Dibatalkan", detail: "Pesanan telah dibatalkan" },
};

export function getOrderDisplayStatus(input: DisplayStatusInput): OrderDisplayStatus {
  if (input.orderStatus === "cancelled") return statuses.cancelled;
  if (input.paymentStatus === "review") return statuses.payment_review;
  if (input.paymentStatus === "expired") return statuses.payment_expired;
  if (input.paymentStatus === "failed") return statuses.payment_failed;
  if (input.paymentStatus === "pending" || input.orderStatus === "awaiting_payment") return statuses.awaiting_payment;
  if (input.shipmentStatus === "delivered" || input.orderStatus === "fulfilled") return statuses.fulfilled;
  if (input.shipmentStatus === "exception") return statuses.exception;
  if (input.shipmentStatus === "in_transit") return statuses.in_transit;
  if (input.shipmentStatus === "picked_up") return statuses.picked_up;
  if (input.shipmentStatus === "awb_created") return statuses.awb_created;
  if (input.shipmentStatus === "pending_awb") return statuses.pending_awb;
  if (input.orderStatus === "processing") return statuses.processing;
  return statuses.paid;
}

export function shipmentStatusLabel(status?: ShipmentStatus | string | null): string {
  if (!status) return "Belum ada pengiriman";
  const labels: Record<string, string> = {
    pending_awb: "Menyiapkan pengiriman",
    awb_created: "Resi dibuat",
    picked_up: "Paket dijemput",
    in_transit: "Dalam perjalanan",
    delivered: "Paket diterima",
    exception: "Kendala pengiriman",
  };
  return labels[String(status)] ?? String(status).replaceAll("_", " ");
}

export function paymentStatusLabel(status?: PaymentStatus | string | null): string {
  const labels: Record<string, string> = {
    pending: "Menunggu pembayaran",
    paid: "Lunas",
    failed: "Gagal",
    expired: "Kedaluwarsa",
    review: "Perlu verifikasi",
  };
  return labels[String(status || "")] ?? String(status || "-").replaceAll("_", " ");
}

export function canRetryBceShipment(input: { paymentStatus?: string | null; awbNumber?: string | null; shipmentError?: string | null }): boolean {
  return input.paymentStatus === "paid" && !input.awbNumber && Boolean(input.shipmentError?.trim());
}
