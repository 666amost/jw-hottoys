import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/providers/cart-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "JW Hottoys — Action Figure 3D Print",
    template: "%s · JW Hottoys",
  },
  description:
    "Toko action figure, chibi, dan designer toys hasil 3D print. Checkout QRIS dan pengiriman melalui BCE Express.",
  openGraph: {
    title: "JW Hottoys",
    description: "Action figure dan desk toys hasil 3D print.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#082f3d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <CartProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <MobileBottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
