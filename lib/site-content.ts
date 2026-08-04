import "server-only";

import { cache } from "react";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { SiteAnnouncement } from "@/lib/types";

const fallbackAnnouncements: SiteAnnouncement[] = [
  {
    id: "default-shipping",
    label: "Flat ongkir Rp10.000",
    message: "Jakarta & Tangerang sampai 3 kg",
    href: "/search",
  },
  {
    id: "default-release",
    label: "Latest drop",
    message: "Rilisan terbaru sudah tayang",
    href: "/#rilisan",
  },
];

type AnnouncementRow = SiteAnnouncement & {
  starts_at: string | null;
  ends_at: string | null;
};

export const getActiveAnnouncements = cache(async (): Promise<SiteAnnouncement[]> => {
  if (!isSupabaseConfigured() || !env.supabaseUrl) return fallbackAnnouncements;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_announcements")
      .select("id,label,message,href,starts_at,ends_at")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(8);

    if (error) return fallbackAnnouncements;

    const now = Date.now();
    return ((data ?? []) as AnnouncementRow[])
      .filter((item) => {
        const started = !item.starts_at || new Date(item.starts_at).getTime() <= now;
        const notEnded = !item.ends_at || new Date(item.ends_at).getTime() > now;
        return started && notEnded;
      })
      .map(({ id, label, message, href }) => ({ id, label, message, href }));
  } catch {
    return fallbackAnnouncements;
  }
});
