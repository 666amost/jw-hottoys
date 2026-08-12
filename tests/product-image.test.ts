import { describe, expect, it } from "vitest";
import { getWebpValidationError, MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_IMAGE_DIMENSION } from "../shared/product-image";

describe("product image validation", () => {
  it("accepts a WebP RIFF signature", () => {
    const bytes = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);
    expect(getWebpValidationError(bytes)).toBeNull();
    expect(MAX_PRODUCT_IMAGE_DIMENSION).toBe(1600);
  });

  it("rejects spoofed and oversized payloads", () => {
    expect(getWebpValidationError(new TextEncoder().encode("not-an-image"))).toBe("INVALID_SIGNATURE");
    expect(getWebpValidationError(new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1))).toBe("TOO_LARGE");
  });
});
