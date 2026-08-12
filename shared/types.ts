export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "review";
export type OrderStatus = "awaiting_payment" | "paid" | "processing" | "fulfilled" | "cancelled";
export type ShipmentStatus = "pending_awb" | "awb_created" | "picked_up" | "in_transit" | "delivered" | "exception";

export type Category = { id: string; name: string; slug: string; description?: string | null };
export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  regularPrice: number;
  salePrice: number | null;
  stockOnHand: number;
  reservedStock: number;
  shippingWeightGrams: number;
};
export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: Category;
  images: string[];
  featured: boolean;
  published: boolean;
  variant: ProductVariant;
};
export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  shippingWeightGrams: number;
  availableStock: number;
};
export type ShippingPrice = {
  totalWeightGrams: number;
  billableWeightKg: number;
  referenceAmount: number;
  chargedAmount: number;
  discountAmount: number;
};
export type SiteAnnouncement = { id: string; label: string; message: string; href: string | null };
export type Address = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postalCode: string;
  addressLine: string;
  landmark: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};
export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  awbNumber?: string | null;
};
