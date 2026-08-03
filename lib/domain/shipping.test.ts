import { describe, expect, it } from "vitest";
import { calculateCartShipping, calculateShippingFromWeight, isSupportedDestination } from "./shipping";

describe("calculateShippingFromWeight", () => {
  it.each([
    [600, 1, 10_000, 10_000, 0],
    [1_200, 2, 20_000, 10_000, 10_000],
    [2_400, 3, 30_000, 10_000, 20_000],
    [3_600, 4, 40_000, 20_000, 20_000],
    [4_800, 5, 50_000, 30_000, 20_000],
  ])(
    "prices %i grams as %i kg",
    (grams, billableKg, reference, charged, discount) => {
      expect(calculateShippingFromWeight(grams)).toEqual({
        totalWeightGrams: grams,
        billableWeightKg: billableKg,
        referenceAmount: reference,
        chargedAmount: charged,
        discountAmount: discount,
      });
    },
  );

  it("uses one kilogram minimum", () => {
    expect(calculateShippingFromWeight(0).chargedAmount).toBe(10_000);
  });

  it("rejects invalid weight", () => {
    expect(() => calculateShippingFromWeight(-1)).toThrow();
  });
});

describe("calculateCartShipping", () => {
  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [5, 3],
  ])("rounds %i default 600 gram SKUs to %i kg", (quantity, expectedKg) => {
    expect(
      calculateCartShipping([{ quantity, shippingWeightGrams: 600 }]).billableWeightKg,
    ).toBe(expectedKg);
  });
});

describe("isSupportedDestination", () => {
  it("accepts Jakarta and Tangerang only", () => {
    expect(isSupportedDestination("Jakarta Barat")).toBe(true);
    expect(isSupportedDestination("Kota Tangerang")).toBe(true);
    expect(isSupportedDestination("Bekasi")).toBe(false);
  });
});
