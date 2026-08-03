import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  MAX_PRODUCT_IMAGE_DIMENSION,
  optimizeProductImage,
} from "@/lib/product-image";

describe("product image optimization", () => {
  it("resizes a large image and encodes it as WebP", async () => {
    const source = await sharp({
      create: {
        width: 2400,
        height: 1800,
        channels: 3,
        background: { r: 247, g: 183, b: 24 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeProductImage(
      new File([new Uint8Array(source)], "product.png", { type: "image/png" }),
    );
    const metadata = await sharp(result.data).metadata();

    expect(result.contentType).toBe("image/webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBeLessThanOrEqual(MAX_PRODUCT_IMAGE_DIMENSION);
    expect(metadata.height).toBeLessThanOrEqual(MAX_PRODUCT_IMAGE_DIMENSION);
    expect(result.size).toBeLessThan(source.byteLength);
  });

  it("rejects files that are not supported images", async () => {
    const file = new File([new TextEncoder().encode("not an image")], "fake.jpg", {
      type: "image/jpeg",
    });

    await expect(optimizeProductImage(file)).rejects.toThrow();
  });
});
