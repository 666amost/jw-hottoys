<script setup lang="ts">
import type { Product } from "~~/shared/types";
import { PhShoppingBag as ShoppingBag } from "@phosphor-icons/vue";
const props = defineProps<{ product: Product }>();
const added = ref(false);
const { add } = useCart();
function submit() {
  const p = props.product;
  add({ variantId: p.variant.id, productId: p.id, slug: p.slug, name: p.name, sku: p.variant.sku, image: p.images[0] ?? "/product-placeholder.svg", unitPrice: p.variant.salePrice ?? p.variant.regularPrice, regularPrice: p.variant.regularPrice, shippingWeightGrams: p.variant.shippingWeightGrams, availableStock: p.variant.stockOnHand - p.variant.reservedStock });
  added.value = true; setTimeout(() => { added.value = false; }, 1200);
}
</script>
<template><AppButton :disabled="product.variant.stockOnHand - product.variant.reservedStock <= 0" @click="submit"><ShoppingBag :size="19"/>{{ added ? 'Ditambahkan' : 'Tambah ke keranjang' }}</AppButton></template>
