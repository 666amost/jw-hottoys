export type ShippingProvider = "BCE" | "JNE";

export type ShippingOption = {
  provider: ShippingProvider;
  serviceCode: string;
  serviceName: string;
  description: string;
  etd: string;
  referenceAmount: number;
  chargedAmount: number;
  discountAmount: number;
};

