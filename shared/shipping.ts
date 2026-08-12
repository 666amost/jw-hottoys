import type { CartLine, ShippingPrice } from "./types";

export const SHIPPING_RATE_PER_KG = 10_000;
export const FLAT_PROMO_MAX_KG = 3;
export const DEFAULT_SKU_WEIGHT_GRAMS = 600;

export function calculateShippingFromWeight(totalWeightGrams: number): ShippingPrice {
  if (!Number.isFinite(totalWeightGrams) || totalWeightGrams < 0) throw new Error("Berat kiriman tidak valid.");
  const billableWeightKg = Math.max(1, Math.ceil(totalWeightGrams / 1_000));
  const referenceAmount = billableWeightKg * SHIPPING_RATE_PER_KG;
  const chargedAmount = SHIPPING_RATE_PER_KG + Math.max(0, billableWeightKg - FLAT_PROMO_MAX_KG) * SHIPPING_RATE_PER_KG;
  return { totalWeightGrams, billableWeightKg, referenceAmount, chargedAmount, discountAmount: referenceAmount - chargedAmount };
}

export function calculateCartShipping(lines: Pick<CartLine, "quantity" | "shippingWeightGrams">[]) {
  return calculateShippingFromWeight(lines.reduce((total, line) => total + Math.max(0, Math.floor(line.quantity)) * line.shippingWeightGrams, 0));
}

export function isSupportedDestination(city: string) {
  const normalized = city.trim().toLowerCase();
  return normalized.includes("jakarta") || normalized.includes("tangerang");
}
