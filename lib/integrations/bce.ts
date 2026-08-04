import "server-only";

import { z } from "zod";
import { env } from "@/lib/env";

const shipmentResponseSchema = z
  .object({
    awb: z.string().optional(),
    awb_number: z.string().optional(),
    tracking_url: z.string().url().optional(),
    id: z.string().optional(),
    data: z
      .object({
        awb: z.string().optional(),
        awb_number: z.string().optional(),
        tracking_url: z.string().url().optional(),
        id: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export type BceShipmentPayload = {
  externalOrderId: string;
  recipient: {
    name: string;
    phone: string;
    addressLine: string;
    province: string;
    city: string;
    district: string;
    subdistrict: string;
    postalCode: string;
    landmark: string;
    latitude: number | null;
    longitude: number | null;
  };
  actualWeightGrams: number;
  billableWeightKg: number;
  contentDescription: string;
  packageCount: number;
  shippingChargedAmount: number;
};

async function bceFetch(path: string, init: RequestInit) {
  if (!env.bceApiUrl || !env.bcePartnerKey) {
    throw new Error("BCE_API_URL atau BCE_PARTNER_KEY belum dikonfigurasi.");
  }

  return fetch(`${env.bceApiUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.bcePartnerKey}`,
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

export async function createBceShipment(
  payload: BceShipmentPayload,
  idempotencyKey: string,
) {
  const response = await bceFetch("/api/v1/partner/shipments", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      external_order_id: payload.externalOrderId,
      sender: { warehouse_code: "JWLAB-STUDIO-JKT" },
      recipient: {
        name: payload.recipient.name,
        phone: payload.recipient.phone,
        address_line: payload.recipient.addressLine,
        province: payload.recipient.province,
        city: payload.recipient.city,
        district: payload.recipient.district,
        subdistrict: payload.recipient.subdistrict,
        postal_code: payload.recipient.postalCode,
        landmark: payload.recipient.landmark,
        latitude: payload.recipient.latitude,
        longitude: payload.recipient.longitude,
      },
      actual_weight_grams: payload.actualWeightGrams,
      billable_weight_kg: payload.billableWeightKg,
      content_description: payload.contentDescription,
      package_count: payload.packageCount,
      shipping_charged_amount: payload.shippingChargedAmount,
    }),
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`BCE menolak pembuatan shipment (${response.status}).`);
  }

  const parsed = shipmentResponseSchema.parse(raw);
  const value = parsed.data ?? parsed;
  const awb = value.awb_number ?? value.awb;
  if (!awb) throw new Error("BCE tidak mengembalikan nomor AWB.");

  return {
    awb,
    trackingUrl: value.tracking_url ?? null,
    externalReference: value.id ?? awb,
  };
}

const trackingSchema = z.object({
  awb_number: z.string(),
  status: z.string(),
  events: z
    .array(
      z.object({
        id: z.string(),
        status: z.string(),
        location: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        note: z.string().optional().nullable(),
        created_at: z.string(),
      }),
    )
    .default([]),
});

export async function getBceTracking(awb: string) {
  const response = await bceFetch(
    `/api/v1/partner/shipments/${encodeURIComponent(awb)}/tracking`,
    { method: "GET" },
  );
  if (!response.ok) throw new Error(`BCE tracking gagal (${response.status}).`);
  return trackingSchema.parse(await response.json());
}
