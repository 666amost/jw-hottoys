import { PaymentStatus } from "@/components/payment/payment-status";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <section className="container-shell py-16 sm:py-24">
      {order ? <PaymentStatus orderNumber={order} /> : <p className="text-center">Nomor order tidak ditemukan.</p>}
    </section>
  );
}

