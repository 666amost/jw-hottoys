export type BceShipmentStatus = "awb_created" | "picked_up" | "in_transit" | "delivered" | "exception";

const bceStatusMap: Record<string, BceShipmentStatus> = {
  warehouse: "awb_created",
  processed: "awb_created",
  awb_created: "awb_created",
  picked_up: "picked_up",
  out_for_delivery: "in_transit",
  in_transit: "in_transit",
  delivered: "delivered",
  exception: "exception",
};

const permanentBceHttpStatuses = new Set([400, 401, 409, 422]);

export function mapBceTrackingStatus(status: string): BceShipmentStatus | null {
  return bceStatusMap[status] ?? null;
}

export function isPermanentBceHttpStatus(status: number): boolean {
  return permanentBceHttpStatuses.has(status);
}

export function buildBceTrackingUrl(baseUrl: string, awb: string): string | null {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const normalizedAwb = awb.trim();
  if (!normalizedBaseUrl || !normalizedAwb) return null;
  return `${normalizedBaseUrl}/${encodeURIComponent(normalizedAwb)}`;
}
