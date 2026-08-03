import "server-only";

import { timingSafeEqual } from "node:crypto";
import { Webhook } from "svix";
import { z } from "zod";
import { env } from "@/lib/env";
import { getSumoPodReturnUrls } from "@/lib/integrations/sumopod-return-urls";

const paymentResponseSchema = z
  .object({
    id: z.string().optional(),
    payment_id: z.string().optional(),
    payment_url: z.string().url().optional(),
    payment_link: z.string().url().optional(),
    payment_link_url: z.string().url().optional(),
    checkout_url: z.string().url().optional(),
    url: z.string().url().optional(),
    data: z
      .object({
        id: z.string().optional(),
        payment_id: z.string().optional(),
        payment_url: z.string().url().optional(),
        payment_link: z.string().url().optional(),
        payment_link_url: z.string().url().optional(),
        checkout_url: z.string().url().optional(),
        url: z.string().url().optional(),
      })
      .optional(),
  })
  .passthrough();

export type SumoPodPayment = {
  paymentId: string;
  paymentUrl: string;
};

export async function createSumoPodPayment(input: {
  orderNumber: string;
  amount: number;
}): Promise<SumoPodPayment> {
  if (!env.sumopodApiKey) {
    throw new Error("SUMOPOD_API_KEY belum dikonfigurasi.");
  }

  const response = await fetch(`${env.sumopodApiUrl.replace(/\/$/, "")}/api/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.sumopodApiKey,
    },
    body: JSON.stringify({
      order_id: input.orderNumber,
      amount: input.amount,
      currency: "IDR",
      expires_in_hours: 1,
      ...getSumoPodReturnUrls(env.siteUrl, input.orderNumber),
      payment_method_type_code: "QRIS",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) {
    const gatewayMessage =
      raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string"
        ? `: ${raw.error}`
        : "";
    throw new Error(`SumoPod menolak pembayaran (${response.status})${gatewayMessage}.`);
  }

  const parsed = paymentResponseSchema.parse(raw);
  const value = parsed.data ?? parsed;
  const paymentId = value.payment_id ?? value.id;
  const paymentUrl =
    value.payment_url ??
    value.payment_link ??
    value.payment_link_url ??
    value.checkout_url ??
    value.url;
  if (!paymentId || !paymentUrl) {
    throw new Error("Respons SumoPod tidak berisi payment ID atau payment URL.");
  }

  return { paymentId, paymentUrl };
}

function safeEqual(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifySumoPodWebhook(rawBody: string, headers: Headers) {
  if (env.sumopodWebhookSecret) {
    const event = new Webhook(env.sumopodWebhookSecret).verify(rawBody, {
      "svix-id": headers.get("svix-id") ?? "",
      "svix-timestamp": headers.get("svix-timestamp") ?? "",
      "svix-signature": headers.get("svix-signature") ?? "",
    });
    return event;
  }

  const receivedToken = headers.get("x-webhook-token") ?? "";
  if (!env.sumopodWebhookToken || !safeEqual(env.sumopodWebhookToken, receivedToken)) {
    throw new Error("Webhook SumoPod tidak terverifikasi.");
  }

  return JSON.parse(rawBody) as unknown;
}
