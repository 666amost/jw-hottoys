"use client";

import { Check, Handbag, Minus, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addProduct } = useCart();
  const stock = Math.max(0, product.variant.stockOnHand - product.variant.reservedStock);

  const handleAdd = () => {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  if (stock === 0) {
    return (
      <Button disabled className="w-full sm:w-auto">
        Stok habis
      </Button>
    );
  }

  return (
    <div className="grid gap-3 sm:flex">
      <div className="flex h-13 items-center justify-between rounded-full border border-slate-200 bg-white p-1 sm:w-36">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-40"
          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          disabled={quantity <= 1}
          aria-label="Kurangi kuantitas"
        >
          <Minus size={17} weight="bold" />
        </button>
        <span className="font-bold tabular-nums">{quantity}</span>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-40"
          onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
          disabled={quantity >= stock}
          aria-label="Tambah kuantitas"
        >
          <Plus size={17} weight="bold" />
        </button>
      </div>
      <Button size="lg" className="min-w-52" onClick={handleAdd}>
        {added ? <Check size={21} weight="bold" /> : <Handbag size={21} weight="bold" />}
        {added ? "Masuk keranjang" : "Tambah ke keranjang"}
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/cart">Keranjang</Link>
      </Button>
    </div>
  );
}
