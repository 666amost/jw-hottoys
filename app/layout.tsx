import type { Metadata, Viewport } from "next";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CartProvider } from "@/components/providers/cart-provider";
import { RouteTransition } from "@/components/providers/route-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveAnnouncements } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "JWLAB STUDIO — Original Collectible Figures",
    template: "%s · JWLAB STUDIO",
  },
  description:
    "Koleksi figure karakter, chibi, dan designer toys orisinal untuk display dan hadiah. Checkout QRIS dan pengiriman melalui BCE Express.",
  openGraph: {
    title: "JWLAB STUDIO",
    description: "Figure karakter dan designer toys orisinal yang layak jadi pusat perhatian.",
    type: "website",
    locale: "id_ID",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111217",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const announcements = await getActiveAnnouncements();

  return (
    <html lang="id">
      <body>
        <CartProvider>
          <SiteHeader announcements={announcements} />
          <RouteTransition>{children}</RouteTransition>
          <SiteFooter />
          <MobileBottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
