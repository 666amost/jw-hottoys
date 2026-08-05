import { describe, expect, it } from "vitest";
import { orderLookupIdentifierSchema } from "./order-identifiers";

describe("order lookup identifiers", () => {
  it.each([
    "JWH-20260805-01010",
    "JWL-20260805-01010",
    "7b79cc02-773c-45b0-9bb3-81b7fe154bea",
  ])("accepts %s", (identifier) => {
    expect(orderLookupIdentifierSchema.safeParse(identifier).success).toBe(true);
  });

  it.each([
    "JWH-20260805-1010",
    "ABC-20260805-01010",
    "JWH-20260805-01010,or(user_id.neq.x)",
  ])("rejects %s", (identifier) => {
    expect(orderLookupIdentifierSchema.safeParse(identifier).success).toBe(false);
  });
});
