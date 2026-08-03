import { apiError, serverError } from "@/lib/api";
import { env } from "@/lib/env";
import { createBceShipment } from "@/lib/integrations/bce";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

type QueueMessage = {
  msg_id: number;
  read_ct: number;
  message: { order_id: string; order_number: string };
};

export async function POST(request: Request) {
  if (!env.cronSecret || request.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return apiError("Tidak diizinkan.", 401, "UNAUTHORIZED");
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("read_shipment_queue", {
      p_visibility_timeout: 90,
      p_quantity: 5,
    });
    if (error) throw error;

    const results = [];
    for (const queued of (data ?? []) as QueueMessage[]) {
      try {
        const result = await processShipment(queued);
        await admin.rpc("archive_shipment_message", { p_msg_id: queued.msg_id });
        results.push({ orderId: queued.message.order_id, ok: true, awb: result });
      } catch (error) {
        const safeMessage = error instanceof Error ? error.message.slice(0, 300) : "Unknown error";
        await admin
          .from("shipments")
          .update({ error_message: safeMessage, retry_count: queued.read_ct })
          .eq("order_id", queued.message.order_id);
        results.push({ orderId: queued.message.order_id, ok: false, error: safeMessage });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return serverError(error);
  }
}

export const GET = POST;

async function processShipment(queued: QueueMessage) {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id,order_number,recipient_name,recipient_phone,shipping_address,billable_weight_kg,shipping_charged_amount,order_items(product_name,quantity,shipping_weight_grams),shipments(id,awb_number)",
    )
    .eq("id", queued.message.order_id)
    .eq("payment_status", "paid")
    .single();
  if (error || !order) throw error ?? new Error("Order paid tidak ditemukan.");

  const existingShipment = Array.isArray(order.shipments) ? order.shipments[0] : order.shipments;
  if (existingShipment?.awb_number) return existingShipment.awb_number as string;

  const items = (order.order_items ?? []) as Array<{
    product_name: string;
    quantity: number;
    shipping_weight_grams: number;
  }>;
  const address = order.shipping_address as Record<string, string | number | null>;
  const shipment = await createBceShipment(
    {
      externalOrderId: order.order_number,
      recipient: {
        name: order.recipient_name,
        phone: order.recipient_phone,
        addressLine: String(address.address_line ?? ""),
        province: String(address.province ?? ""),
        city: String(address.city ?? ""),
        district: String(address.district ?? ""),
        subdistrict: String(address.subdistrict ?? ""),
        postalCode: String(address.postal_code ?? ""),
        landmark: String(address.landmark ?? ""),
        latitude: typeof address.latitude === "number" ? address.latitude : null,
        longitude: typeof address.longitude === "number" ? address.longitude : null,
      },
      actualWeightGrams: items.reduce(
        (total, item) => total + item.shipping_weight_grams * item.quantity,
        0,
      ),
      billableWeightKg: order.billable_weight_kg,
      contentDescription: items.map((item) => `${item.product_name} x${item.quantity}`).join(", "),
      packageCount: 1,
      shippingChargedAmount: order.shipping_charged_amount,
    },
    order.id,
  );

  let shipmentId = existingShipment?.id as string | undefined;
  if (!shipmentId) {
    const { data: created, error: createError } = await admin
      .from("shipments")
      .upsert({ order_id: order.id }, { onConflict: "order_id" })
      .select("id")
      .single();
    if (createError || !created) throw createError ?? new Error("Shipment lokal gagal dibuat.");
    shipmentId = created.id;
  }
  const { error: updateError } = await admin
    .from("shipments")
    .update({
      awb_number: shipment.awb,
      status: "awb_created",
      external_reference: shipment.externalReference,
      tracking_url: shipment.trackingUrl,
      last_synced_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", shipmentId);
  if (updateError) throw updateError;

  await admin.from("shipment_events").upsert(
    {
      shipment_id: shipmentId,
      external_event_id: `created:${shipment.awb}`,
      status: "awb_created",
      location: "Jakarta",
      note: "Resi BCE Express berhasil dibuat",
      occurred_at: new Date().toISOString(),
    },
    { onConflict: "shipment_id,external_event_id" },
  );
  await admin.rpc("enqueue_tracking_reconciliation", {
    p_shipment_id: shipmentId,
    p_delay_seconds: 300,
  });

  return shipment.awb;
}
