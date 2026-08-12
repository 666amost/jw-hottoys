PRAGMA foreign_keys = ON;

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0 CHECK (emailVerified IN (0, 1)),
  image TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
) STRICT;

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expiresAt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
) STRICT;
CREATE INDEX session_user_idx ON session(userId);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt INTEGER,
  refreshTokenExpiresAt INTEGER,
  scope TEXT,
  password TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
) STRICT;
CREATE UNIQUE INDEX account_provider_identity_idx ON account(providerId, accountId);
CREATE INDEX account_user_idx ON account(userId);

CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER,
  updatedAt INTEGER
) STRICT;
CREATE INDEX verification_identifier_idx ON verification(identifier);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE admin_roles (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  subdistrict TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  address_line TEXT NOT NULL,
  landmark TEXT NOT NULL DEFAULT '',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX addresses_user_idx ON addresses(user_id, created_at DESC);
CREATE UNIQUE INDEX addresses_one_default_per_user ON addresses(user_id) WHERE is_default = 1;

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX products_catalog_idx ON products(published, featured, created_at DESC);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  regular_price INTEGER NOT NULL CHECK (regular_price >= 0),
  sale_price INTEGER CHECK (sale_price IS NULL OR sale_price >= 0),
  stock_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (stock_on_hand >= 0),
  reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0 AND reserved_stock <= stock_on_hand),
  shipping_weight_grams INTEGER NOT NULL CHECK (shipping_weight_grams > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX product_variants_product_idx ON product_variants(product_id, active);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  byte_size INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
) STRICT;
CREATE INDEX product_images_product_idx ON product_images(product_id, sort_order);

CREATE TABLE vouchers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('fixed', 'percentage')),
  value INTEGER NOT NULL CHECK (value > 0),
  minimum_order INTEGER NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
  max_discount INTEGER CHECK (max_discount IS NULL OR max_discount >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TEXT,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE order_sequences (
  day_key TEXT PRIMARY KEY,
  last_value INTEGER NOT NULL CHECK (last_value > 0)
) STRICT;

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES user(id),
  address_id TEXT REFERENCES addresses(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL CHECK (json_valid(shipping_address)),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_reference_amount INTEGER NOT NULL CHECK (shipping_reference_amount >= 0),
  shipping_discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (shipping_discount_amount >= 0),
  shipping_charged_amount INTEGER NOT NULL CHECK (shipping_charged_amount >= 0),
  voucher_discount_amount INTEGER NOT NULL DEFAULT 0 CHECK (voucher_discount_amount >= 0),
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  voucher_id TEXT REFERENCES vouchers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','paid','processing','fulfilled','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','expired','review')),
  expires_at TEXT NOT NULL,
  paid_at TEXT,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX orders_expiry_idx ON orders(payment_status, expires_at);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 20),
  line_total INTEGER NOT NULL CHECK (line_total = unit_price * quantity),
  shipping_weight_grams INTEGER NOT NULL CHECK (shipping_weight_grams > 0),
  UNIQUE(order_id, variant_id)
) STRICT;

CREATE TRIGGER order_item_price_guard
BEFORE INSERT ON order_items
WHEN NOT EXISTS (
  SELECT 1 FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE v.id = NEW.variant_id AND v.active = 1 AND p.published = 1
    AND NEW.unit_price = COALESCE(v.sale_price, v.regular_price)
    AND NEW.shipping_weight_grams = v.shipping_weight_grams
)
BEGIN
  SELECT RAISE(ABORT, 'PRODUCT_CHANGED');
END;

CREATE TABLE order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE stock_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','released')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id, variant_id)
) STRICT;
CREATE INDEX stock_reservations_expiry_idx ON stock_reservations(status, expires_at);

CREATE TRIGGER stock_reservation_guard
BEFORE INSERT ON stock_reservations
WHEN NEW.status = 'active' AND NOT EXISTS (
  SELECT 1 FROM product_variants
  WHERE id = NEW.variant_id AND active = 1
    AND stock_on_hand - reserved_stock >= NEW.quantity
)
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK');
END;

CREATE TRIGGER stock_reservation_added
AFTER INSERT ON stock_reservations
WHEN NEW.status = 'active'
BEGIN
  UPDATE product_variants
  SET reserved_stock = reserved_stock + NEW.quantity, updated_at = NEW.updated_at
  WHERE id = NEW.variant_id;
END;

CREATE TRIGGER stock_reservation_released
AFTER UPDATE OF status ON stock_reservations
WHEN OLD.status = 'active' AND NEW.status = 'released'
BEGIN
  UPDATE product_variants
  SET reserved_stock = reserved_stock - NEW.quantity, updated_at = NEW.updated_at
  WHERE id = NEW.variant_id;
END;

CREATE TRIGGER stock_reservation_consumed
AFTER UPDATE OF status ON stock_reservations
WHEN OLD.status = 'active' AND NEW.status = 'consumed'
BEGIN
  UPDATE product_variants
  SET stock_on_hand = stock_on_hand - NEW.quantity,
      reserved_stock = reserved_stock - NEW.quantity,
      updated_at = NEW.updated_at
  WHERE id = NEW.variant_id;
END;

CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  order_id TEXT REFERENCES orders(id),
  quantity_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT REFERENCES user(id),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE voucher_reservations (
  id TEXT PRIMARY KEY,
  voucher_id TEXT NOT NULL REFERENCES vouchers(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','consumed','released')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TRIGGER voucher_reservation_guard
BEFORE INSERT ON voucher_reservations
WHEN NOT EXISTS (
  SELECT 1 FROM vouchers v
  WHERE v.id = NEW.voucher_id AND v.active = 1
    AND (v.usage_limit IS NULL OR v.used_count + (
      SELECT COUNT(*) FROM voucher_reservations vr
      WHERE vr.voucher_id = v.id AND vr.status = 'active'
    ) < v.usage_limit)
)
BEGIN
  SELECT RAISE(ABORT, 'VOUCHER_UNAVAILABLE');
END;

CREATE TABLE voucher_redemptions (
  id TEXT PRIMARY KEY,
  voucher_id TEXT NOT NULL REFERENCES vouchers(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_payment_id TEXT UNIQUE,
  payment_url TEXT,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired','review')),
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE payment_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  processed_at TEXT NOT NULL,
  UNIQUE(provider, event_id)
) STRICT;

CREATE TABLE shipping_quotes (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  total_weight_grams INTEGER NOT NULL,
  billable_weight_kg INTEGER NOT NULL,
  reference_amount INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL,
  charged_amount INTEGER NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE shipments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'BCE',
  awb_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_awb' CHECK (status IN ('pending_awb','awb_created','picked_up','in_transit','delivered','exception')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_tracking_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX shipments_tracking_idx ON shipments(status, next_tracking_at);

CREATE TABLE shipment_events (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_awb','awb_created','picked_up','in_transit','delivered','exception')),
  location TEXT,
  note TEXT,
  occurred_at TEXT NOT NULL,
  payload TEXT CHECK (payload IS NULL OR json_valid(payload)),
  UNIQUE(shipment_id, external_event_id)
) STRICT;
CREATE INDEX shipment_events_timeline_idx ON shipment_events(shipment_id, occurred_at DESC);

CREATE TABLE api_rate_limits (
  key TEXT PRIMARY KEY,
  window_started_at TEXT NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0)
) STRICT;

CREATE TABLE site_announcements (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX site_announcements_display_idx ON site_announcements(active, sort_order);

CREATE TABLE outbox_jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('shipment_creation','tracking_reconciliation')),
  dedupe_key TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','completed','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TEXT NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(kind, dedupe_key)
) STRICT;
CREATE INDEX outbox_pending_idx ON outbox_jobs(status, available_at);

CREATE TRIGGER user_profile_created
AFTER INSERT ON user
BEGIN
  INSERT OR IGNORE INTO profiles(id, full_name, avatar_url, created_at, updated_at)
  VALUES(NEW.id, NEW.name, NEW.image, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
