export default defineEventHandler(async (event) => {
  assertSafeMutation(event);
  const session = await requireUser(event);
  const input = checkoutSchema.safeParse(await readLimitedBody(event));
  if (!input.success) apiError(422, "VALIDATION_ERROR", "Data checkout tidak valid.");
  const env = bindings(event);
  if (!await consumeRateLimit(env.DB, `checkout:${session.user.id}`, 10, 60)) apiError(429, "RATE_LIMITED", "Terlalu banyak percobaan checkout.");
  let order: Awaited<ReturnType<typeof createCheckout>>;
  try {
    order = await createCheckout(env.DB, session.user.id, input.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CHECKOUT_REJECTED";
    const friendly = message.includes("STOCK") ? "Stok salah satu produk baru saja habis."
      : message.includes("DESTINATION") ? "Pengiriman hanya tersedia untuk Jakarta dan Tangerang."
        : message.includes("ADDRESS") ? "Alamat tidak ditemukan."
          : message.includes("VOUCHER") ? "Voucher tidak valid atau kuotanya habis."
            : "Checkout tidak dapat diproses. Periksa kembali keranjang dan alamat.";
    apiError(409, "CHECKOUT_REJECTED", friendly);
  }
  try {
    const payment = await createSumoPodPayment(appConfig(event), { orderNumber: order.order_number, amount: order.total_amount });
    await env.DB.prepare("UPDATE payments SET external_payment_id=?,payment_url=?,updated_at=datetime('now') WHERE order_id=?")
      .bind(payment.paymentId, payment.paymentUrl, order.order_id).run();
    return { ...order, payment_id: payment.paymentId, payment_url: payment.paymentUrl };
  } catch (error) {
    await cancelCheckout(env.DB, order.order_id, "Gagal membuat pembayaran SumoPod");
    throw error;
  }
});
