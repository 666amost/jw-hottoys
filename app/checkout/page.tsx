import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id,label,recipient_name,phone,address_line,district,city,postal_code,is_default")
    .order("is_default", { ascending: false })
    .order("created_at");

  return (
    <section className="container-shell py-8 sm:py-12">
      <CheckoutForm addresses={addresses ?? []} />
    </section>
  );
}

