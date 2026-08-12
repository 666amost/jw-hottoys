/// <reference types="@cloudflare/workers-types" />

export {};

declare global {
  interface CloudflareBindings {
    DB: D1Database;
    PRODUCT_IMAGES: R2Bucket;
    SHIPMENT_QUEUE: Queue;
    TRACKING_QUEUE: Queue;
    BETTER_AUTH_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SUMOPOD_API_URL?: string;
    SUMOPOD_API_KEY?: string;
    SUMOPOD_WEBHOOK_SECRET?: string;
    SUMOPOD_WEBHOOK_TOKEN?: string;
    BCE_API_URL?: string;
    BCE_PARTNER_KEY?: string;
    BCE_WEBHOOK_SECRET?: string;
    R2_PUBLIC_BASE_URL?: string;
  }
}

declare module "h3" {
  interface H3EventContext {
    cloudflare: {
      request: Request;
      env: CloudflareBindings;
      context: ExecutionContext;
    };
  }
}
