import type { H3Event } from "h3";

const PRIVATE_API_PATHS = [
  "/api/account",
  "/api/admin",
  "/api/auth",
  "/api/checkout",
  "/api/orders",
  "/api/session",
];

export function isPrivateApiRequest(event: Pick<H3Event, "path">) {
  return PRIVATE_API_PATHS.some((prefix) => event.path === prefix || event.path.startsWith(`${prefix}/`) || event.path.startsWith(`${prefix}?`));
}

export default defineEventHandler((event) => {
  if (!isPrivateApiRequest(event)) return;

  setResponseHeader(event, "Cache-Control", "private, no-store, no-cache, max-age=0, must-revalidate");
  setResponseHeader(event, "CDN-Cache-Control", "no-store");
  setResponseHeader(event, "Cloudflare-CDN-Cache-Control", "no-store");
  setResponseHeader(event, "Pragma", "no-cache");
  setResponseHeader(event, "Vary", "Cookie, Authorization");
});
