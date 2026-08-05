import { describe, expect, it } from "vitest";
import {
  getOrderLookupColumn,
  orderLookupIdentifierSchema,
} from "./order-identifiers";

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

  it("selects a type-safe database column for each identifier format", () => {
    expect(getOrderLookupColumn("JWH-20260805-01010")).toBe("order_number");
    expect(getOrderLookupColumn("7b79cc02-773c-45b0-9bb3-81b7fe154bea")).toBe("id");
  });
});
