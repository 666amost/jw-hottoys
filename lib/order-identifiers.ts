import { z } from "zod";

const orderNumberPattern = /^JW(?:H|L)-[0-9]{8}-[0-9]{5,}$/;

export const orderLookupIdentifierSchema = z.string().refine(
  (value) => z.string().uuid().safeParse(value).success || orderNumberPattern.test(value),
  "Nomor order tidak valid.",
);
