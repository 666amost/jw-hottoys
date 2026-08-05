import { PaymentStatus } from "@/components/payment/payment-status";
import {
  getOrderLookupColumn,
  orderLookupIdentifierSchema,
} from "@/lib/order-identifiers";
import type { PaymentStatusData } from "@/lib/payment-status-monitoring";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const identifier = orderLookupIdentifierSchema.safeParse(order);
  let initialStatus: PaymentStatusData | null = null;

  if (identifier.success) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "id,order_number,status,payment_status,total_amount,payments(payment_url,expires_at),shipments(awb_number,status,tracking_url)",
      )
      .eq(getOrderLookupColumn(identifier.data), identifier.data)
      .maybeSingle();
    initialStatus = data as PaymentStatusData | null;
  }

  return (
    <section className="container-shell py-16 sm:py-24">
      {identifier.success ? (
        <PaymentStatus
          key={identifier.data}
          orderNumber={identifier.data}
          initialStatus={initialStatus}
        />
      ) : (
        <p className="text-center">Nomor order tidak ditemukan.</p>
      )}
    </section>
  );
}
