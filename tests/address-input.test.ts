import { describe, expect, it } from "vitest";
import { addressInputSchema, addressValidationMessage } from "../server/utils/address-input";

describe("address input validation", () => {
  it("returns an actionable message for a short phone number", () => {
    const result = addressInputSchema.safeParse({
      label: "Toko",
      recipientName: "Robert",
      phone: "08866",
      provinceCode: "12",
      cityCode: "1212",
      districtCode: "121201",
      subdistrictCode: "1212010001",
      postalCode: "22315",
      addressLine: "Pasar Laguboti",
      landmark: "",
      latitude: 2.3,
      longitude: 99.1,
      isDefault: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(addressValidationMessage(result.error)).toBe("Nomor telepon minimal 8 dan maksimal 20 karakter.");
    }
  });
});
