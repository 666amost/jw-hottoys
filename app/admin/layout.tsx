import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { RouteTransition } from "@/components/providers/route-transition";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const [{ data: isAdmin }, { data: profile }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!isAdmin) redirect("/account");

  const displayName = profile?.full_name || user.user_metadata.full_name || "Administrator";

  return (
    <AdminShell displayName={displayName} email={user.email ?? ""}>
      <RouteTransition>{children}</RouteTransition>
    </AdminShell>
  );
}
