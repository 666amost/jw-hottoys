import { CartView } from "@/components/cart-view";

export const metadata = { title: "Keranjang" };

export default function CartPage() {
  return (
    <div className="container-shell py-8 sm:py-12">
      <CartView />
    </div>
  );
}
