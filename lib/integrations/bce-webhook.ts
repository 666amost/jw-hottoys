import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function verifyBceWebhook(rawBody: string, headers: Headers) {
  const timestamp = headers.get("x-bce-timestamp") ?? "";
  const received = (headers.get("x-bce-signature") ?? "").replace(/^sha256=/, "");
  const timestampMs = Number(timestamp) * 1000;
  if (
    !env.bceWebhookSecret ||
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000
  ) {
    return false;
  }

  const expected = createHmac("sha256", env.bceWebhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

