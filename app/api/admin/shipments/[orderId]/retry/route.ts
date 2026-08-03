import { apiError, serverError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return apiError("Sesi login diperlukan.", 401, "AUTH_REQUIRED");

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) return apiError("Akses admin diperlukan.", 403, "FORBIDDEN");

    const { data, error } = await supabase.rpc("enqueue_shipment_retry", {
      p_order_id: orderId,
    });
    if (error) throw error;
    return Response.json({ queued: true, messageId: data });
  } catch (error) {
    return serverError(error);
  }
}

