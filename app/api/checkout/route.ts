import { z } from "zod";
import { apiError, serverError } from "@/lib/api";
import { createSumoPodPayment } from "@/lib/integrations/sumopod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  voucherCode: z.string().trim().max(32).optional().nullable(),
  lines: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});

type CheckoutResult = {
  order_id: string;
  order_number: string;
  total_amount: number;
  shipping_reference_amount: number;
  shipping_discount_amount: number;
  shipping_charged_amount: number;
  expires_at: string;
};

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 64 * 1024) {
      return apiError("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
    }
    const input = checkoutSchema.safeParse(await request.json());
    if (!input.success) return apiError("Data checkout tidak valid.", 422, "VALIDATION_ERROR");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("Silakan login dengan Google.", 401, "AUTH_REQUIRED");
    const { data: allowed, error: rateError } = await createAdminClient().rpc(
      "consume_rate_limit",
      {
        p_key: `checkout:${user.id}`,
        p_limit: 10,
        p_window_seconds: 60,
      },
    );
    if (rateError) throw rateError;
    if (!allowed) return apiError("Terlalu banyak percobaan checkout.", 429, "RATE_LIMITED");

    const { data, error } = await supabase.rpc("create_checkout", {
      p_lines: input.data.lines.map((line) => ({
        variant_id: line.variantId,
        quantity: line.quantity,
      })),
      p_address_id: input.data.addressId,
      p_voucher_code: input.data.voucherCode || null,
    });
    if (error) return apiError(mapCheckoutError(error.message), 409, "CHECKOUT_REJECTED");

    const order = data as CheckoutResult;
    try {
      const payment = await createSumoPodPayment({
        orderNumber: order.order_number,
        amount: Number(order.total_amount),
      });

      const admin = createAdminClient();
      const { error: paymentError } = await admin
        .from("payments")
        .update({
          external_payment_id: payment.paymentId,
          payment_url: payment.paymentUrl,
        })
        .eq("order_id", order.order_id);
      if (paymentError) throw paymentError;

      return Response.json({
        ...order,
        payment_id: payment.paymentId,
        payment_url: payment.paymentUrl,
      });
    } catch (gatewayError) {
      await createAdminClient().rpc("cancel_checkout", {
        p_order_id: order.order_id,
        p_reason: "Gagal membuat pembayaran SumoPod",
      });
      throw gatewayError;
    }
  } catch (error) {
    return serverError(error);
  }
}

function mapCheckoutError(message: string) {
  if (message.includes("INSUFFICIENT_STOCK")) return "Stok salah satu produk baru saja habis.";
  if (message.includes("DESTINATION_NOT_SUPPORTED")) return "Pengiriman hanya tersedia untuk Jakarta dan Tangerang.";
  if (message.includes("ADDRESS_NOT_FOUND")) return "Alamat tidak ditemukan.";
  if (message.includes("VOUCHER")) return "Voucher tidak valid, tidak memenuhi syarat, atau kuotanya habis.";
  return "Checkout tidak dapat diproses. Periksa kembali keranjang dan alamat.";
}
