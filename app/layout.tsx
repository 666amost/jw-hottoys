import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
