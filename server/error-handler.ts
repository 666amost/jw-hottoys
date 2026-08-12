import type { H3Error, H3Event } from "h3";
import { send, setResponseHeader, setResponseStatus } from "h3";

export default async function apiErrorHandler(error: H3Error, event: H3Event) {
  const payload = (error.data as { error?: { code: string; message: string } } | undefined)?.error;
  if (!event.path.startsWith("/api/") || !payload) return;
  setResponseStatus(event, error.statusCode || 500);
  setResponseHeader(event, "content-type", "application/json; charset=utf-8");
  return send(event, JSON.stringify({ error: payload }));
}
