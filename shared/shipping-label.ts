export const SHIPPING_LABEL_SENDER = {
  name: "JWLAB STUDIO",
  city: "TANGERANG",
} as const;

export type ShippingLabelAddress = {
  address_line?: string;
  subdistrict?: string;
  district?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  landmark?: string;
};

export type ShippingLabelItem = {
  product_name: string;
  variant_name: string;
  sku: string;
  quantity: number;
};

export type ShippingLabelOrder = {
  id: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: ShippingLabelAddress;
  awbNumber: string;
  totalWeightGrams: number;
  billableWeightKg: number;
  items: ShippingLabelItem[];
};

export function normalizeAwbForBarcode(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function shippingLabelItemText(item: ShippingLabelItem): string {
  const variant = item.variant_name.trim();
  return `${item.quantity}× ${item.sku} — ${item.product_name}${variant ? ` / ${variant}` : ""}`;
}

export function paginateLabelItemsByHeight(
  items: ShippingLabelItem[],
  measuredHeights: number[],
  firstPageHeight: number,
  continuationPageHeight: number,
): ShippingLabelItem[][] {
  if (!items.length) return [[]];
  const pages: ShippingLabelItem[][] = [];
  let page: ShippingLabelItem[] = [];
  let usedHeight = 0;
  let availableHeight = firstPageHeight;

  items.forEach((item, index) => {
    const itemHeight = Math.max(1, measuredHeights[index] || 1);
    if (page.length && usedHeight + itemHeight > availableHeight) {
      pages.push(page);
      page = [];
      usedHeight = 0;
      availableHeight = continuationPageHeight;
    }
    page.push(item);
    usedHeight += itemHeight;
  });
  if (page.length) pages.push(page);
  return pages;
}
