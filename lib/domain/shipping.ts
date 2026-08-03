import type { CartLine, ShippingPrice } from "@/lib/types";

export const SHIPPING_RATE_PER_KG = 10_000;
export const FLAT_PROMO_MAX_KG = 3;
export const DEFAULT_SKU_WEIGHT_GRAMS = 600;

export function calculateShippingFromWeight(totalWeightGrams: number): ShippingPrice {
  if (!Number.isFinite(totalWeightGrams) || totalWeightGrams < 0) {
    throw new Error("Berat kiriman tidak valid.");
  }

  const billableWeightKg = Math.max(1, Math.ceil(totalWeightGrams / 1_000));
  const referenceAmount = billableWeightKg * SHIPPING_RATE_PER_KG;
  const chargedAmount =
    SHIPPING_RATE_PER_KG +
    Math.max(0, billableWeightKg - FLAT_PROMO_MAX_KG) * SHIPPING_RATE_PER_KG;

  return {
    totalWeightGrams,
    billableWeightKg,
    referenceAmount,
    chargedAmount,
    discountAmount: referenceAmount - chargedAmount,
  };
}

export function calculateCartShipping(lines: Pick<CartLine, "quantity" | "shippingWeightGrams">[]) {
  const totalWeightGrams = lines.reduce((total, line) => {
    const quantity = Math.max(0, Math.floor(line.quantity));
    return total + quantity * line.shippingWeightGrams;
  }, 0);

  return calculateShippingFromWeight(totalWeightGrams);
}

export function isSupportedDestination(city: string) {
  const normalized = city.trim().toLowerCase();
  return normalized.includes("jakarta") || normalized.includes("tangerang");
}
