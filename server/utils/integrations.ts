import { Webhook } from "svix";
import { z } from "zod";
import { getSumoPodReturnUrls } from "~~/lib/integrations/sumopod-return-urls";

// SumoPod accepts a whole number of hours. JWLAB enforces its stricter
// 30-minute reservation deadline in createCheckout and the webhook handler.
const QRIS_EXPIRY_HOURS = 1;

const paymentResponseSchema = z.object({
  id: z.string().optional(), payment_id: z.string().optional(), payment_url: z.string().url().optional(),
  payment_link: z.string().url().optional(), payment_link_url: z.string().url().optional(),
  checkout_url: z.string().url().optional(), url: z.string().url().optional(),
  data: z.object({
    id: z.string().optional(), payment_id: z.string().optional(), payment_url: z.string().url().optional(),
    payment_link: z.string().url().optional(), payment_link_url: z.string().url().optional(),
    checkout_url: z.string().url().optional(), url: z.string().url().optional(),
  }).optional(),
}).passthrough();

export async function createSumoPodPayment(config: ReturnType<typeof appConfig>, input: { orderNumber: string; amount: number }) {
  if (!config.sumopodApiKey) throw new Error("SUMOPOD_API_KEY belum dikonfigurasi.");
  const response = await fetch(`${config.sumopodApiUrl.replace(/\/$/, "")}/api/v1/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": config.sumopodApiKey },
    body: JSON.stringify({
      order_id: input.orderNumber, amount: input.amount, currency: "IDR", expires_in_hours: QRIS_EXPIRY_HOURS,
      ...getSumoPodReturnUrls(config.siteUrl, input.orderNumber),
      payment_method_type_code: "QRIS",
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const raw = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`SumoPod menolak pembayaran (${response.status}).`);
  const parsed = paymentResponseSchema.parse(raw);
  const value = parsed.data ?? parsed;
  const paymentId = value.payment_id ?? value.id;
  const paymentUrl = value.payment_url ?? value.payment_link ?? value.payment_link_url ?? value.checkout_url ?? value.url;
  if (!paymentId || !paymentUrl) throw new Error("Respons SumoPod tidak berisi payment ID atau URL.");
  return { paymentId, paymentUrl };
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export function verifySumoPodWebhook(config: ReturnType<typeof appConfig>, rawBody: string, headers: Headers) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (config.sumopodWebhookSecret && id && timestamp && signature) {
    try {
      return new Webhook(config.sumopodWebhookSecret).verify(rawBody, { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": signature });
    } catch { /* sandbox token fallback */ }
  }
  const token = headers.get("x-webhook-token") ?? "";
  if (!config.sumopodWebhookToken || !constantTimeEqual(config.sumopodWebhookToken, token)) throw new Error("INVALID_SIGNATURE");
  return JSON.parse(rawBody) as unknown;
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyBceWebhook(config: ReturnType<typeof appConfig>, rawBody: string, headers: Headers) {
  const timestamp = headers.get("x-bce-timestamp") ?? "";
  const received = (headers.get("x-bce-signature") ?? "").replace(/^sha256=/, "");
  const timestampMs = Number(timestamp) * 1000;
  if (!config.bceWebhookSecret || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 300_000) return false;
  return constantTimeEqual(await hmacHex(config.bceWebhookSecret, `${timestamp}.${rawBody}`), received);
}

async function bceFetch(config: Pick<CloudflareBindings, "BCE_API_URL" | "BCE_PARTNER_KEY">, path: string, init: RequestInit) {
  if (!config.BCE_API_URL || !config.BCE_PARTNER_KEY) throw new Error("BCE belum dikonfigurasi.");
  return fetch(`${config.BCE_API_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.BCE_PARTNER_KEY}`, ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
}

export async function createBceShipment(config: Pick<CloudflareBindings, "BCE_API_URL" | "BCE_PARTNER_KEY">, payload: Record<string, unknown>, idempotencyKey: string) {
  const response = await bceFetch(config, "/api/v1/partner/shipments", {
    method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(payload),
  });
  const raw = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok || !raw) throw new Error(`BCE menolak pembuatan shipment (${response.status}).`);
  const value = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const awb = String(value.awb_number || value.awb || "");
  if (!awb) throw new Error("BCE tidak mengembalikan nomor AWB.");
  return { awb, trackingUrl: value.tracking_url ? String(value.tracking_url) : null, externalReference: String(value.id || awb) };
}

export async function getBceTracking(config: Pick<CloudflareBindings, "BCE_API_URL" | "BCE_PARTNER_KEY">, awb: string) {
  const response = await bceFetch(config, `/api/v1/partner/shipments/${encodeURIComponent(awb)}/tracking`, { method: "GET" });
  if (!response.ok) throw new Error(`BCE tracking gagal (${response.status}).`);
  return await response.json() as { awb_number: string; status: string; events?: Array<{ id: string; status: string; location?: string | null; notes?: string | null; note?: string | null; created_at: string }> };
}
