"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  client ??= createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
  return client;
}
