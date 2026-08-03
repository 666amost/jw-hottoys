import { apiError, serverError } from "@/lib/api";
import { env } from "@/lib/env";
import { getBceTracking } from "@/lib/integrations/bce";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShipmentStatus } from "@/lib/types";

type TrackingMessage = {
  msg_id: number;
  read_ct: number;
  message: { shipment_id: string };
};

const statusMap: Record<string, ShipmentStatus> = {
  warehouse: "awb_created",
  processed: "awb_created",
  awb_created: "awb_created",
  picked_up: "picked_up",
  out_for_delivery: "in_transit",
  in_transit: "in_transit",
  delivered: "delivered",
  exception: "exception",
};

export async function POST(request: Request) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return apiError("Tidak diizinkan.", 401, "UNAUTHORIZED");
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("read_tracking_queue", {
      p_visibility_timeout: 90,
      p_quantity: 10,
    });
    if (error) throw error;

    const results = [];
    for (const queued of (data ?? []) as TrackingMessage[]) {
      try {
        const { data: shipment, error: shipmentError } = await admin
          .from("shipments")
          .select("id,awb_number,status")
          .eq("id", queued.message.shipment_id)
          .single();
        if (shipmentError || !shipment?.awb_number) throw shipmentError ?? new Error("AWB belum ada.");

        const tracking = await getBceTracking(shipment.awb_number);
        for (const event of tracking.events) {
          const { error: eventError } = await admin.rpc("process_shipment_event", {
            p_event_id: event.id,
            p_awb_number: shipment.awb_number,
            p_status: statusMap[event.status] ?? "exception",
            p_location: event.location ?? "",
            p_note: event.notes ?? event.note ?? "",
            p_occurred_at: event.created_at,
          });
          if (eventError) throw eventError;
        }
        const status = statusMap[tracking.status] ?? "exception";
        if (!tracking.events.length) {
          const { error: statusError } = await admin.rpc("process_shipment_event", {
            p_event_id: `reconcile:${shipment.awb_number}:${tracking.status}`,
            p_awb_number: shipment.awb_number,
            p_status: status,
            p_location: "",
            p_note: "Status hasil rekonsiliasi BCE",
            p_occurred_at: new Date().toISOString(),
          });
          if (statusError) throw statusError;
        }
        await admin.rpc("archive_tracking_message", { p_msg_id: queued.msg_id });
        if (!["delivered", "exception"].includes(status)) {
          await admin.rpc("enqueue_tracking_reconciliation", {
            p_shipment_id: shipment.id,
            p_delay_seconds: 300,
          });
        }
        results.push({ shipmentId: shipment.id, ok: true, status });
      } catch (trackingError) {
        results.push({
          shipmentId: queued.message.shipment_id,
          ok: false,
          error: trackingError instanceof Error ? trackingError.message.slice(0, 200) : "Unknown",
        });
      }
    }
    return Response.json({ processed: results.length, results });
  } catch (error) {
    return serverError(error);
  }
}

export const GET = POST;
