import type { CartLine } from "~~/shared/types";

export function useCart() {
  const lines = useState<CartLine[]>("cart-lines", () => []);
  const hydrated = useState("cart-hydrated", () => false);
  if (import.meta.client && !hydrated.value) {
    try { lines.value = JSON.parse(localStorage.getItem("jwlab-cart") || "[]"); } catch { lines.value = []; }
    hydrated.value = true;
    watch(lines, (value) => localStorage.setItem("jwlab-cart", JSON.stringify(value)), { deep: true });
  }
  const count = computed(() => lines.value.reduce((sum, line) => sum + line.quantity, 0));
  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  function add(line: Omit<CartLine, "quantity">, quantity = 1) {
    const existing = lines.value.find((item) => item.variantId === line.variantId);
    if (existing) existing.quantity = Math.min(existing.availableStock, existing.quantity + quantity);
    else lines.value.push({ ...line, quantity: Math.min(quantity, line.availableStock) });
  }
  function update(variantId: string, quantity: number) {
    const line = lines.value.find((item) => item.variantId === variantId);
    if (!line) return;
    if (quantity <= 0) lines.value = lines.value.filter((item) => item.variantId !== variantId);
    else line.quantity = Math.min(line.availableStock, quantity);
  }
  function clear() { lines.value = []; }
  return { lines, count, subtotal, add, update, clear };
}
