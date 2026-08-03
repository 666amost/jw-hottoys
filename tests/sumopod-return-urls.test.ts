import { describe, expect, it } from "vitest";
import { getSumoPodReturnUrls } from "../lib/integrations/sumopod-return-urls";

describe("SumoPod return URLs", () => {
  it("omits localhost URLs rejected by the payment gateway", () => {
    expect(getSumoPodReturnUrls("http://localhost:3000", "JWH-20260730-00001")).toEqual({});
    expect(getSumoPodReturnUrls("http://127.0.0.1:3000", "JWH-20260730-00001")).toEqual({});
  });

  it("builds encoded return URLs for a public site", () => {
    expect(getSumoPodReturnUrls("https://shop.example.com", "JWH/001")).toEqual({
      success_return_url: "https://shop.example.com/payment/success?order=JWH%2F001",
      cancel_return_url: "https://shop.example.com/payment/cancel?order=JWH%2F001",
    });
  });

  it("omits malformed or unsupported site URLs", () => {
    expect(getSumoPodReturnUrls("not-a-url", "JWH-1")).toEqual({});
    expect(getSumoPodReturnUrls("ftp://shop.example.com", "JWH-1")).toEqual({});
  });
});
