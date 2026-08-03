import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const storeMigration = readFileSync(
  resolve(root, "supabase/migrations/202607290001_initial_store.sql"),
  "utf8",
);
const bceMigration = readFileSync(
  resolve(
    root,
    "potonganwebappBCEExpress/supabase/migrations/202607290001_jw_hot_toys_partner.sql",
  ),
  "utf8",
);
const sumopodAdapter = readFileSync(resolve(root, "lib/integrations/sumopod.ts"), "utf8");

describe("payment and stock database contract", () => {
  it("makes payment events and shipment creation idempotent", () => {
    expect(storeMigration).toContain("unique(provider, event_id)");
    expect(storeMigration).toContain("unique(order_id, variant_id)");
    expect(storeMigration).toContain("on conflict(order_id) do nothing");
    expect(storeMigration).toContain("'shipment_creation'");
  });

  it("reserves before payment and consumes stock exactly once after paid", () => {
    expect(storeMigration).toContain("status = 'active' for update");
    expect(storeMigration).toContain("stock_on_hand = stock_on_hand - v_reservation.quantity");
    expect(storeMigration).toContain("reserved_stock = reserved_stock - v_reservation.quantity");
    expect(storeMigration).toContain("update public.stock_reservations set status = 'consumed'");
  });

  it("sends the server-calculated final order total to SumoPod", () => {
    expect(sumopodAdapter).toContain("amount: input.amount");
    expect(sumopodAdapter).toContain('payment_method_type_code: "QRIS"');
    expect(sumopodAdapter).toContain("value.payment_link_url");
    expect(sumopodAdapter).not.toContain("shipping_reference_amount");
  });
});

describe("BCE JW-HOTTOYS flat billing contract", () => {
  it("uses the customer charged amount as BCE total with no second discount", () => {
    expect(bceMigration).toContain("'JW-HOTTOYS'");
    expect(bceMigration).toContain("'agent_flat'");
    expect(bceMigration).toContain("p_shipping_charged_amount, 0, 0, 0, p_shipping_charged_amount");
    expect(bceMigration).toContain("buktimembayar, potongan");
  });

  it("uses a database sequence and idempotency table for collision-safe AWB", () => {
    expect(bceMigration).toContain("create sequence if not exists public.jw_hot_toys_awb_seq");
    expect(bceMigration).toContain("idempotency_key text primary key");
    expect(bceMigration).toContain("nextval('public.jw_hot_toys_awb_seq')");
    expect(bceMigration).toContain("manifest_awb_no_unique");
  });
});
