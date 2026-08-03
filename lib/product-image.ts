import sharp from "sharp";

export const MAX_PRODUCT_IMAGE_SOURCE_BYTES = 15 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_OUTPUT_BYTES = 3_500_000;
export const MAX_PRODUCT_IMAGE_DIMENSION = 1600;

const allowedFormats = new Set(["jpeg", "png", "webp", "avif"]);

export async function optimizeProductImage(file: File) {
  if (file.size <= 0 || file.size > MAX_PRODUCT_IMAGE_SOURCE_BYTES) {
    throw new Error("INVALID_IMAGE_SIZE");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  }).metadata();

  if (!metadata.format || !allowedFormats.has(metadata.format)) {
    throw new Error("INVALID_IMAGE_FORMAT");
  }

  const { data, info } = await sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: MAX_PRODUCT_IMAGE_DIMENSION,
      height: MAX_PRODUCT_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 80,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer({ resolveWithObject: true });

  if (data.byteLength > MAX_PRODUCT_IMAGE_OUTPUT_BYTES) {
    throw new Error("OPTIMIZED_IMAGE_TOO_LARGE");
  }

  return {
    data,
    contentType: "image/webp" as const,
    extension: "webp" as const,
    width: info.width,
    height: info.height,
    size: data.byteLength,
  };
}
