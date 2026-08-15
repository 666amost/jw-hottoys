<script setup lang="ts">
import type { ShippingLabelItem, ShippingLabelOrder } from "~~/shared/shipping-label";
import { normalizeAwbForBarcode, SHIPPING_LABEL_SENDER, shippingLabelItemText } from "~~/shared/shipping-label";

const props = defineProps<{
  label: ShippingLabelOrder;
  items: ShippingLabelItem[];
  pageNumber: number;
  totalPages: number;
  continuation?: boolean;
}>();

const address = computed(() => props.label.shippingAddress || {});
const destination = computed(() => [address.value.city, address.value.district]
  .filter(Boolean).join(" / ").toUpperCase() || "TUJUAN");
const locality = computed(() => [address.value.subdistrict, address.value.district]
  .filter(Boolean).join(" · "));
const region = computed(() => [address.value.city, address.value.province, address.value.postal_code]
  .filter(Boolean).join(" · "));
const partyDensity = computed(() => {
  const length = [props.label.recipientName, address.value.address_line, address.value.landmark, locality.value, region.value]
    .filter(Boolean).join(" ").length;
  if (length > 360) return "label-party-extra-dense";
  if (length > 220) return "label-party-dense";
  return "";
});
const actualWeight = computed(() => `${Math.max(0, props.label.totalWeightGrams / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} KG`);
const normalizedAwb = computed(() => normalizeAwbForBarcode(props.label.awbNumber));
</script>

<template>
  <article class="shipping-label-page" :data-awb="normalizedAwb">
    <header class="label-header">
      <div class="label-brand label-brand-jwlab">
        <img src="/logo-jwlab-studio.webp" alt="" class="label-jwlab-logo">
        <div><b>JWLAB STUDIO</b><small>FULFILLMENT</small></div>
      </div>
      <img src="/bce-logo-resi.png" alt="BCE Express" class="label-bce-logo">
      <span class="label-paid-badge">PAID</span>
    </header>

    <section v-if="!continuation" class="label-party-block" :class="partyDensity">
      <div class="label-sender-line"><b>FROM:</b> {{ SHIPPING_LABEL_SENDER.name }} — {{ SHIPPING_LABEL_SENDER.city }}</div>
      <div class="label-ship-to">SHIP TO</div>
      <div class="label-recipient-row">
        <strong>{{ label.recipientName }}</strong>
        <span>{{ label.recipientPhone }}</span>
      </div>
      <p class="label-address-main">{{ address.address_line || "-" }}</p>
      <p v-if="address.landmark" class="label-landmark">PATOKAN: {{ address.landmark }}</p>
      <p class="label-address-region">{{ locality }}</p>
      <p class="label-address-region"><b>{{ region }}</b></p>
    </section>

    <section v-else class="label-continuation-identity">
      <div><b>LANJUTAN DAFTAR PESANAN</b><span>PAGE {{ pageNumber }}/{{ totalPages }}</span></div>
      <p>{{ label.recipientName }} · {{ destination }}</p>
    </section>

    <div v-if="!continuation" class="label-destination">{{ destination }}</div>

    <section class="label-code-row">
      <div class="label-qr-box">
        <AwbQrCode :value="label.awbNumber" />
        <b>{{ normalizedAwb }}</b>
      </div>
      <div class="label-data-box">
        <span class="label-code-caption">AWB DATA MATRIX</span>
        <DataMatrixBarcode :value="label.awbNumber" />
        <div class="label-order-number"><small>NO. PESANAN</small><b>{{ label.orderNumber }}</b></div>
        <span class="label-page-number">PAGE {{ pageNumber }}/{{ totalPages }}</span>
      </div>
    </section>

    <section class="label-items" :class="continuation ? 'label-items-continuation' : 'label-items-primary'">
      <div class="label-items-title"><b>ISI PESANAN</b><span>{{ label.items.length }} JENIS BARANG</span></div>
      <div class="label-items-list">
        <div v-for="(item, index) in items" :key="`${item.sku}-${index}`" class="shipping-item-row">
          {{ shippingLabelItemText(item) }}
        </div>
      </div>
    </section>

    <footer class="label-footer">
      <b>1 PACKAGE</b>
      <span>AKTUAL {{ actualWeight }}</span>
      <span>BILLABLE {{ label.billableWeightKg }} KG</span>
      <b>BCE EXPRESS</b>
    </footer>
  </article>
</template>

<style>
.shipping-label-page,
.shipping-label-page * { box-sizing: border-box; }
.shipping-label-page {
  width: 378px;
  height: 567px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #000;
  background: #fff;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
}
.label-header {
  height: 46px;
  flex: 0 0 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  border-bottom: 2px solid #000;
}
.label-brand { display: flex; align-items: center; min-width: 0; }
.label-brand-jwlab { flex: 1; gap: 4px; }
.label-brand-jwlab div { display: flex; min-width: 0; flex-direction: column; line-height: 1; }
.label-brand-jwlab b { white-space: nowrap; font-size: 10px; letter-spacing: .2px; }
.label-brand-jwlab small { margin-top: 2px; font-size: 5.5px; font-weight: 800; letter-spacing: 1px; }
.label-jwlab-logo { width: 34px; height: 34px; object-fit: contain; filter: grayscale(1) contrast(1.5); }
.label-bce-logo { width: 90px; max-height: 30px; object-fit: contain; filter: grayscale(1) contrast(1.7); }
.label-paid-badge { flex: 0 0 auto; border: 2px solid #000; background: #000; color: #fff; padding: 6px 5px; font-size: 11px; font-weight: 900; letter-spacing: .8px; }
.label-party-block { height: 126px; flex: 0 0 126px; padding: 4px 7px; border-bottom: 2px solid #000; overflow: hidden; }
.label-sender-line { padding-bottom: 3px; border-bottom: 1px solid #000; font-size: 6.5px; letter-spacing: .2px; }
.label-ship-to { margin-top: 3px; font-size: 7px; font-weight: 900; letter-spacing: 1.2px; }
.label-recipient-row { display: flex; align-items: baseline; justify-content: space-between; gap: 7px; line-height: 1.1; }
.label-recipient-row strong { min-width: 0; overflow-wrap: anywhere; font-size: 15px; text-transform: uppercase; }
.label-recipient-row span { flex: 0 0 auto; font-size: 9px; font-weight: 800; }
.label-address-main { margin: 3px 0 0; font-size: 9px; font-weight: 700; line-height: 1.16; overflow-wrap: anywhere; }
.label-landmark { margin: 2px 0 0; font-size: 7px; line-height: 1.1; }
.label-address-region { margin: 2px 0 0; font-size: 7.5px; line-height: 1.05; text-transform: uppercase; }
.label-party-dense .label-recipient-row strong { font-size: 12px; }
.label-party-dense .label-recipient-row span { font-size: 8px; }
.label-party-dense .label-address-main { margin-top: 2px; font-size: 7.5px; line-height: 1.08; }
.label-party-dense .label-landmark { margin-top: 1px; font-size: 6px; }
.label-party-dense .label-address-region { margin-top: 1px; font-size: 6.5px; }
.label-party-extra-dense .label-recipient-row strong { font-size: 10px; }
.label-party-extra-dense .label-recipient-row span { font-size: 7px; }
.label-party-extra-dense .label-address-main { margin-top: 1px; font-size: 6.5px; line-height: 1.02; }
.label-party-extra-dense .label-landmark { margin-top: 1px; font-size: 5.5px; line-height: 1; }
.label-party-extra-dense .label-address-region { margin-top: 1px; font-size: 5.8px; line-height: 1; }
.label-destination { height: 38px; flex: 0 0 38px; display: grid; place-items: center; overflow: hidden; border-bottom: 2px solid #000; padding: 2px 6px; font-size: 18px; font-weight: 900; line-height: 1; text-align: center; letter-spacing: .5px; }
.label-continuation-identity { height: 54px; flex: 0 0 54px; padding: 6px 8px; border-bottom: 2px solid #000; }
.label-continuation-identity div { display: flex; justify-content: space-between; gap: 8px; font-size: 9px; }
.label-continuation-identity p { margin: 6px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 900; text-transform: uppercase; }
.label-code-row { height: 118px; flex: 0 0 118px; display: grid; grid-template-columns: 112px minmax(0, 1fr); border-bottom: 2px solid #000; }
.label-qr-box { display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; border-right: 2px solid #000; padding: 2px; }
.label-qr-box .awb-qr-image { width: 88px; height: 88px; display: block; image-rendering: pixelated; }
.label-qr-box b { max-width: 104px; margin-top: -1px; overflow: hidden; font-family: "Courier New", monospace; font-size: 8px; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
.label-data-box { position: relative; display: flex; min-width: 0; flex-direction: column; align-items: center; justify-content: center; padding: 4px 7px 3px; }
.label-code-caption { align-self: stretch; font-size: 5.5px; font-weight: 900; letter-spacing: 1px; }
.label-data-box .data-matrix-code { width: 190px; max-width: 100%; height: 55px; display: block; }
.label-order-number { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 5px; border-top: 1px solid #000; padding-top: 3px; }
.label-order-number small { font-size: 5.5px; font-weight: 800; letter-spacing: .6px; }
.label-order-number b { overflow: hidden; font-family: "Courier New", monospace; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.label-page-number { position: absolute; right: 5px; top: 4px; font-size: 5px; font-weight: 900; }
.label-items { min-height: 0; flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.label-items-title { height: 23px; flex: 0 0 23px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border-bottom: 1px solid #000; padding: 3px 7px; font-size: 7px; letter-spacing: .4px; }
.label-items-title span { font-size: 5.5px; font-weight: 800; }
.label-items-list { min-height: 0; flex: 1; overflow: hidden; }
.shipping-item-row { min-height: 18px; border-bottom: 1px dotted #777; padding: 3px 7px; font-size: 8px; font-weight: 700; line-height: 1.2; overflow-wrap: anywhere; }
.label-footer { height: 26px; flex: 0 0 26px; display: flex; align-items: center; justify-content: space-between; gap: 3px; border-top: 2px solid #000; padding: 2px 6px; font-size: 6.5px; white-space: nowrap; }
@media print {
  .shipping-label-page { border: 0; }
}
</style>
