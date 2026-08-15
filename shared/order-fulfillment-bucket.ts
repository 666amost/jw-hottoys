export type FulfillmentBucket = "needs_processing" | "processed";

export type FulfillmentBucketInput = {
  paymentStatus?: string | null;
  orderStatus?: string | null;
  shipmentStatus?: string | null;
  awbNumber?: string | null;
  labelPrintedAt?: string | null;
};

export function getFulfillmentBucket(input: FulfillmentBucketInput): FulfillmentBucket | null {
  const isActive = input.paymentStatus === "paid"
    && Boolean(input.awbNumber?.trim())
    && input.orderStatus !== "fulfilled"
    && input.orderStatus !== "cancelled"
    && input.shipmentStatus !== "delivered";

  if (!isActive) return null;
  return input.labelPrintedAt ? "processed" : "needs_processing";
}
