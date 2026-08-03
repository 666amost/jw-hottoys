"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "jw-hottoys-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  addProduct: (product: Product, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setLines(JSON.parse(stored) as CartLine[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    const availableStock = Math.max(
      0,
      product.variant.stockOnHand - product.variant.reservedStock,
    );
    if (!availableStock) return;

    setLines((current) => {
      const existing = current.find((line) => line.variantId === product.variant.id);
      if (existing) {
        return current.map((line) =>
          line.variantId === product.variant.id
            ? { ...line, quantity: Math.min(availableStock, line.quantity + quantity) }
            : line,
        );
      }

      return [
        ...current,
        {
          variantId: product.variant.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.variant.sku,
          image: product.images[0] || "/product-placeholder.svg",
          unitPrice: product.variant.salePrice ?? product.variant.regularPrice,
          regularPrice: product.variant.regularPrice,
          quantity: Math.min(quantity, availableStock),
          shippingWeightGrams: product.variant.shippingWeightGrams,
          availableStock,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.variantId === variantId
            ? {
                ...line,
                quantity: Math.max(0, Math.min(line.availableStock, Math.floor(quantity))),
              }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((current) => current.filter((line) => line.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal: lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0),
      addProduct,
      setQuantity,
      removeLine,
      clearCart,
    }),
    [lines, addProduct, setQuantity, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
