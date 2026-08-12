import type { H3Event } from "h3";

export function bindings(event: H3Event): CloudflareBindings {
  const value = event.context.cloudflare?.env as unknown as CloudflareBindings | undefined;
  if (!value?.DB) throw createError({ statusCode: 503, statusMessage: "Cloudflare binding DB belum tersedia." });
  return value;
}

export function appConfig(event: H3Event) {
  const runtime = useRuntimeConfig(event);
  const bound = event.context.cloudflare?.env as unknown as CloudflareBindings | undefined;
  return {
    siteUrl: String(bound?.NUXT_PUBLIC_SITE_URL || runtime.public.siteUrl || "http://localhost:3000"),
    betterAuthSecret: String(bound?.BETTER_AUTH_SECRET || runtime.betterAuthSecret || "development-secret-change-me-32-characters"),
    googleClientId: String(bound?.GOOGLE_CLIENT_ID || runtime.googleClientId || ""),
    googleClientSecret: String(bound?.GOOGLE_CLIENT_SECRET || runtime.googleClientSecret || ""),
    sumopodApiUrl: String(bound?.SUMOPOD_API_URL || runtime.sumopodApiUrl || "https://api-pay-sandbox.sumopod.com"),
    sumopodApiKey: String(bound?.SUMOPOD_API_KEY || runtime.sumopodApiKey || ""),
    sumopodWebhookSecret: String(bound?.SUMOPOD_WEBHOOK_SECRET || runtime.sumopodWebhookSecret || ""),
    sumopodWebhookToken: String(bound?.SUMOPOD_WEBHOOK_TOKEN || runtime.sumopodWebhookToken || ""),
    bceApiUrl: String(bound?.BCE_API_URL || runtime.bceApiUrl || ""),
    bcePartnerKey: String(bound?.BCE_PARTNER_KEY || runtime.bcePartnerKey || ""),
    bceWebhookSecret: String(bound?.BCE_WEBHOOK_SECRET || runtime.bceWebhookSecret || ""),
    r2PublicBaseUrl: String(bound?.R2_PUBLIC_BASE_URL || runtime.r2PublicBaseUrl || ""),
  };
}
