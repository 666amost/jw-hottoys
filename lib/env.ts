const hasValue = (value: string | undefined) => Boolean(value && value.trim());

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  sumopodApiUrl: process.env.SUMOPOD_API_URL || "https://api-pay-sandbox.sumopod.com",
  sumopodApiKey: process.env.SUMOPOD_API_KEY || "",
  sumopodWebhookSecret: process.env.SUMOPOD_WEBHOOK_SECRET || "",
  sumopodWebhookToken: process.env.SUMOPOD_WEBHOOK_TOKEN || "",
  bceApiUrl: process.env.BCE_API_URL || "",
  bcePartnerKey: process.env.BCE_PARTNER_KEY || "",
  bceWebhookSecret: process.env.BCE_WEBHOOK_SECRET || "",
  cronSecret: process.env.CRON_SECRET || "",
};

export const isSupabaseConfigured = () =>
  hasValue(env.supabaseUrl) && hasValue(env.supabasePublishableKey);

export const isServerSupabaseConfigured = () =>
  isSupabaseConfigured() && hasValue(env.supabaseServiceRoleKey);
