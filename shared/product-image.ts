export const MAX_PRODUCT_IMAGE_BYTES = 3_500_000;
export const MAX_PRODUCT_IMAGE_DIMENSION = 1600;

export function getWebpValidationError(data: Uint8Array): "INVALID_SIGNATURE" | "TOO_LARGE" | null {
  if (data.length > MAX_PRODUCT_IMAGE_BYTES) return "TOO_LARGE";
  if (data.length < 12) return "INVALID_SIGNATURE";
  const riff = String.fromCharCode(...data.slice(0, 4));
  const webp = String.fromCharCode(...data.slice(8, 12));
  return riff === "RIFF" && webp === "WEBP" ? null : "INVALID_SIGNATURE";
}
