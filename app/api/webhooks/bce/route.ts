import { z } from "zod";
import { apiError, serverError } from "@/lib/api";
import { verifyBceWebhook } from "@/lib/integrations/bce-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const eventSchema = z.object({
  event_id: z.string().min(1),
  awb_number: z.string().min(1),
  status: z.enum(["awb_created", "picked_up", "in_transit", "delivered", "exception"]),
  occurred_at: z.string().datetime({ offset: true }),
  location: z.string().max(120).optional().nullable(),
  note: z.string().max(300).optional().nullable(),
});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 64 * 1024) {
    return apiError("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
  }
  const rawBody = await request.text();
  if (rawBody.length > 64 * 1024) {
    return apiError("Payload terlalu besar.", 413, "PAYLOAD_TOO_LARGE");
  }
  if (!verifyBceWebhook(rawBody, request.headers)) {
    return apiError("Webhook BCE tidak terverifikasi.", 401, "INVALID_SIGNATURE");
  }

  try {
    const event = eventSchema.parse(JSON.parse(rawBody));
    const { data, error } = await createAdminClient().rpc("process_shipment_event", {
      p_event_id: event.event_id,
      p_awb_number: event.awb_number,
      p_status: event.status,
      p_location: event.location ?? "",
      p_note: event.note ?? "",
      p_occurred_at: event.occurred_at,
    });
    if (error?.message.includes("AWB_NOT_FOUND")) {
      return apiError("AWB tidak dikenal.", 404, "AWB_NOT_FOUND");
    }
    if (error) throw error;
    return Response.json({ received: true, transaction: data });
  } catch (error) {
    return serverError(error);
  }
}
