import { z } from "zod";
import { apiError, serverError } from "@/lib/api";
import { verifySumoPodWebhook } from "@/lib/integrations/sumopod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const eventSchema = z.object({
  event_type: z.enum(["payment.completed", "payment.failed", "payment.expired", "payment.test"]),
  data: z
    .object({
      payment_id: z.string().optional().default(""),
      order_id: z.string().optional().default(""),
      amount: z.coerce.number().int().nonnegative().optional().default(0),
      currency: z.string().optional().default("IDR"),
      completed_at: z.string().datetime({ offset: true }).optional(),
    })
    .passthrough(),
});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 1024 * 1024) {
    return apiError("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
  }
  const rawBody = await request.text();
  if (rawBody.length > 1024 * 1024) {
    return apiError("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
  }
  let verified: unknown;
  try {
    verified = verifySumoPodWebhook(rawBody, request.headers);
  } catch {
    return apiError("Webhook signature tidak valid.", 401, "INVALID_SIGNATURE");
  }

  try {
    const event = eventSchema.parse(verified);
    if (event.event_type === "payment.test") return Response.json({ received: true });

    const eventId = request.headers.get("svix-id");
    if (!eventId) return apiError("Header svix-id wajib ada.", 422, "MISSING_EVENT_ID");

    const { data, error } = await createAdminClient().rpc("process_payment_event", {
      p_event_id: eventId,
      p_event_type: event.event_type,
      p_payment_id: event.data.payment_id,
      p_order_number: event.data.order_id,
      p_amount: event.data.amount,
      p_currency: event.data.currency,
      p_completed_at: event.data.completed_at ?? new Date().toISOString(),
      p_payload: verified,
    });
    if (error) throw error;

    return Response.json({ received: true, transaction: data });
  } catch (error) {
    return serverError(error);
  }
}
