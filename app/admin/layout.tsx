import { Gauge, Package, Percent, PlugsConnected, Stack } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Stack },
  { href: "/admin/vouchers", label: "Voucher", icon: Percent },
  { href: "/admin/orders", label: "Order", icon: Package },
  { href: "/admin/integrations", label: "Integrasi BCE", icon: PlugsConnected },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/account");

  return (
    <section className="container-shell py-8 sm:py-12">
      <div className="mb-7 overflow-x-auto">
        <nav className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"><Icon size={17} /> {label}</Link>
          ))}
        </nav>
      </div>
      {children}
    </section>
  );
}

