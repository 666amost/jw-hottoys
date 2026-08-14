import { z } from "zod";
import { calculateShippingFromWeight, isSupportedDestination } from "~~/shared/shipping";

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  voucherCode: z.string().trim().max(32).optional().nullable(),
  lines: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
});

type VariantRow = { id: string; product_id: string; product_name: string; name: string; sku: string; regular_price: number; sale_price: number | null; shipping_weight_grams: number };
type AddressRow = { id: string; recipient_name: string; phone: string; province: string; city: string; district: string; subdistrict: string; postal_code: string; address_line: string; landmark: string; latitude: number; longitude: number };
type VoucherRow = { id: string; kind: "fixed" | "percentage"; value: number; minimum_order: number; max_discount: number | null };

export async function consumeRateLimit(db: D1Database, key: string, limit: number, windowSeconds: number) {
  const row = await db.prepare(`
    INSERT INTO api_rate_limits(key,window_started_at,request_count) VALUES(?,strftime('%Y-%m-%dT%H:%M:%fZ','now'),1)
    ON CONFLICT(key) DO UPDATE SET
      window_started_at=CASE WHEN unixepoch('now')-unixepoch(window_started_at)>=? THEN strftime('%Y-%m-%dT%H:%M:%fZ','now') ELSE window_started_at END,
      request_count=CASE WHEN unixepoch('now')-unixepoch(window_started_at)>=? THEN 1 ELSE request_count+1 END
    RETURNING request_count
  `).bind(key, windowSeconds, windowSeconds).first<{ request_count: number }>();
  return Boolean(row && row.request_count <= limit);
}

async function orderNumber(db: D1Database, now: Date) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  const sequence = await db.prepare(`INSERT INTO order_sequences(day_key,last_value) VALUES(?,1)
    ON CONFLICT(day_key) DO UPDATE SET last_value=last_value+1 RETURNING last_value`).bind(day).first<{ last_value: number }>();
  if (!sequence) throw new Error("ORDER_SEQUENCE_FAILED");
  return `JWL-${day}-${String(sequence.last_value).padStart(5, "0")}`;
}

export async function createCheckout(db: D1Database, userId: string, input: z.infer<typeof checkoutSchema>) {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const address = await db.prepare("SELECT * FROM addresses WHERE id=? AND user_id=?").bind(input.addressId, userId).first<AddressRow>();
  if (!address) throw new Error("ADDRESS_NOT_FOUND");
  if (!isSupportedDestination(address.city)) throw new Error("DESTINATION_NOT_SUPPORTED");

  const quantities = new Map<string, number>();
  for (const line of input.lines) quantities.set(line.variantId, (quantities.get(line.variantId) || 0) + line.quantity);
  const ids = [...quantities.keys()];
  const placeholders = ids.map(() => "?").join(",");
  const { results: variants } = await db.prepare(`
    SELECT v.id,v.product_id,p.name product_name,v.name,v.sku,v.regular_price,v.sale_price,v.shipping_weight_grams
    FROM product_variants v JOIN products p ON p.id=v.product_id
    WHERE v.active=1 AND p.published=1 AND v.id IN (${placeholders})
  `).bind(...ids).all<VariantRow>();
  if (variants.length !== ids.length) throw new Error("PRODUCT_CHANGED");

  const subtotal = variants.reduce((sum, variant) => sum + (variant.sale_price ?? variant.regular_price) * (quantities.get(variant.id) || 0), 0);
  const totalWeight = variants.reduce((sum, variant) => sum + variant.shipping_weight_grams * (quantities.get(variant.id) || 0), 0);
  const shipping = calculateShippingFromWeight(totalWeight);
  let voucher: VoucherRow | null = null;
  let voucherDiscount = 0;
  if (input.voucherCode) {
    voucher = await db.prepare(`SELECT id,kind,value,minimum_order,max_discount FROM vouchers
      WHERE upper(code)=upper(?) AND active=1 AND (starts_at IS NULL OR starts_at<=?) AND (expires_at IS NULL OR expires_at>?)`)
      .bind(input.voucherCode, nowIso, nowIso).first<VoucherRow>();
    if (!voucher || subtotal < voucher.minimum_order) throw new Error("VOUCHER_INVALID");
    voucherDiscount = voucher.kind === "fixed" ? voucher.value : Math.floor(subtotal * voucher.value / 100);
    if (voucher.max_discount != null) voucherDiscount = Math.min(voucherDiscount, voucher.max_discount);
    voucherDiscount = Math.min(voucherDiscount, subtotal);
  }

  const id = crypto.randomUUID();
  const number = await orderNumber(db, now);
  const total = subtotal + shipping.chargedAmount - voucherDiscount;
  const shippingAddress = JSON.stringify(address);
  const statements: D1PreparedStatement[] = [
    db.prepare(`INSERT INTO orders(id,order_number,user_id,address_id,recipient_name,recipient_phone,shipping_address,subtotal,
      shipping_reference_amount,shipping_discount_amount,shipping_charged_amount,voucher_discount_amount,total_amount,voucher_id,expires_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, number, userId, address.id, address.recipient_name, address.phone, shippingAddress, subtotal, shipping.referenceAmount, shipping.discountAmount, shipping.chargedAmount, voucherDiscount, total, voucher?.id ?? null, expiresAt, nowIso, nowIso),
    db.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), id, "awaiting_payment", "Checkout dibuat", nowIso),
    db.prepare("INSERT INTO shipping_quotes(id,order_id,total_weight_grams,billable_weight_kg,reference_amount,discount_amount,charged_amount,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), id, totalWeight, shipping.billableWeightKg, shipping.referenceAmount, shipping.discountAmount, shipping.chargedAmount, nowIso),
    db.prepare("INSERT INTO payments(id,order_id,provider,amount,currency,status,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), id, "sumopod", total, "IDR", "pending", expiresAt, nowIso, nowIso),
  ];
  for (const variant of variants) {
    const quantity = quantities.get(variant.id)!;
    const price = variant.sale_price ?? variant.regular_price;
    statements.push(
      db.prepare("INSERT INTO order_items(id,order_id,variant_id,product_name,variant_name,sku,unit_price,quantity,line_total,shipping_weight_grams) VALUES(?,?,?,?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(), id, variant.id, variant.product_name, variant.name, variant.sku, price, quantity, price * quantity, variant.shipping_weight_grams),
      db.prepare("INSERT INTO stock_reservations(id,order_id,variant_id,quantity,status,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
        .bind(crypto.randomUUID(), id, variant.id, quantity, "active", expiresAt, nowIso, nowIso),
    );
  }
  if (voucher) statements.push(db.prepare("INSERT INTO voucher_reservations(id,voucher_id,user_id,order_id,status,expires_at,created_at) VALUES(?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), voucher.id, userId, id, "active", expiresAt, nowIso));
  await db.batch(statements);
  return { order_id: id, order_number: number, total_amount: total, shipping_reference_amount: shipping.referenceAmount, shipping_discount_amount: shipping.discountAmount, shipping_charged_amount: shipping.chargedAmount, expires_at: expiresAt };
}

export async function cancelCheckout(db: D1Database, orderId: string, reason: string) {
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE stock_reservations SET status='released',updated_at=? WHERE order_id=? AND status='active'").bind(now, orderId),
    db.prepare("UPDATE voucher_reservations SET status='released' WHERE order_id=? AND status='active'").bind(orderId),
    db.prepare("UPDATE orders SET status='cancelled',payment_status='failed',cancelled_at=?,updated_at=? WHERE id=? AND payment_status='pending'").bind(now, now, orderId),
    db.prepare("UPDATE payments SET status='failed',updated_at=? WHERE order_id=? AND status='pending'").bind(now, orderId),
    db.prepare("INSERT INTO order_status_history(id,order_id,status,note,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(), orderId, "cancelled", reason, now),
  ]);
}

export async function dispatchOutbox(env: Pick<CloudflareBindings, "DB" | "SHIPMENT_QUEUE" | "TRACKING_QUEUE">, id: string) {
  const job = await env.DB.prepare("SELECT id,kind,payload FROM outbox_jobs WHERE id=? AND status='pending'").bind(id).first<{ id: string; kind: string; payload: string }>();
  if (!job) return;
  const queue = job.kind === "shipment_creation" ? env.SHIPMENT_QUEUE : env.TRACKING_QUEUE;
  await queue.send({ outboxId: job.id, ...JSON.parse(job.payload) });
  await env.DB.prepare("UPDATE outbox_jobs SET status='sent',attempts=attempts+1,last_error=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").bind(job.id).run();
}
