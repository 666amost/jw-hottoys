import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CartProvider } from "@/components/providers/cart-provider";
import { RouteTransition } from "@/components/providers/route-transition";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveAnnouncements } from "@/lib/site-content";

export default async function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const announcements = await getActiveAnnouncements();

  return (
    <CartProvider>
      <div className="store-shell">
        <SiteHeader announcements={announcements} />
        <RouteTransition>{children}</RouteTransition>
        <SiteFooter />
        <MobileBottomNav />
      </div>
    </CartProvider>
  );
}
