import { z } from "zod";

export const orderIdSchema = z.string().uuid();
export const orderNumberSchema = z.string().regex(/^JW(?:H|L)-[0-9]{8}-[0-9]{5,}$/);

export const orderLookupIdentifierSchema = z.union([orderIdSchema, orderNumberSchema]);

export function getOrderLookupColumn(identifier: string): "id" | "order_number" {
  return orderIdSchema.safeParse(identifier).success ? "id" : "order_number";
}
