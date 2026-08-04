import { apiError, serverError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const identifier = z
      .string()
      .refine((value) => z.string().uuid().safeParse(value).success || /^JWL-[0-9]{8}-[0-9]{5,}$/.test(value))
      .safeParse(orderId);
    if (!identifier.success) return apiError("Nomor order tidak valid.", 422, "VALIDATION_ERROR");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("Sesi login diperlukan.", 401, "AUTH_REQUIRED");

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,order_number,status,payment_status,total_amount,payments(payment_url,expires_at),shipments(awb_number,status,tracking_url)",
      )
      .or(`id.eq.${identifier.data},order_number.eq.${identifier.data}`)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return apiError("Order tidak ditemukan.", 404, "NOT_FOUND");

    return Response.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return serverError(error);
  }
}
