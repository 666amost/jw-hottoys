import { describe, expect, it } from "vitest";
import {
  buildBceTrackingUrl,
  isPermanentBceHttpStatus,
  mapBceTrackingStatus,
} from "../shared/bce-integration";

describe("BCE integration helpers", () => {
  it("maps canonical and legacy tracking statuses", () => {
    expect(mapBceTrackingStatus("awb_created")).toBe("awb_created");
    expect(mapBceTrackingStatus("processed")).toBe("awb_created");
    expect(mapBceTrackingStatus("out_for_delivery")).toBe("in_transit");
    expect(mapBceTrackingStatus("delivered")).toBe("delivered");
  });

  it("does not turn an unknown tracking status into an exception", () => {
    expect(mapBceTrackingStatus("custom_partner_status")).toBeNull();
  });

  it("classifies configuration and payload responses as permanent failures", () => {
    for (const status of [400, 401, 409, 422]) expect(isPermanentBceHttpStatus(status)).toBe(true);
    for (const status of [408, 429, 500, 503]) expect(isPermanentBceHttpStatus(status)).toBe(false);
  });

  it("builds an encoded tracking URL from runtime configuration", () => {
    expect(buildBceTrackingUrl("https://bcexp.id/track/", "BCE/ABC 123")).toBe("https://bcexp.id/track/BCE%2FABC%20123");
    expect(buildBceTrackingUrl("", "BCE123")).toBeNull();
    expect(buildBceTrackingUrl("https://bcexp.id/track", "")).toBeNull();
  });
});
