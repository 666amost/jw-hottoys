import type { H3Event } from "h3";

export function apiError(statusCode: number, code: string, message: string): never {
  throw createError({ statusCode, statusMessage: message, data: { error: { code, message } } });
}

export function assertSafeMutation(event: H3Event) {
  const method = event.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;
  const origin = getHeader(event, "origin");
  if (!origin) return;
  const expected = new URL(appConfig(event).siteUrl).origin;
  if (origin !== expected) apiError(403, "INVALID_ORIGIN", "Origin permintaan tidak diizinkan.");
}

export async function readLimitedBody<T>(event: H3Event, maxBytes = 64 * 1024): Promise<T> {
  const length = Number(getHeader(event, "content-length") || 0);
  if (length > maxBytes) apiError(413, "PAYLOAD_TOO_LARGE", "Payload terlalu besar.");
  return await readBody<T>(event);
}
