PRAGMA foreign_keys = ON;

-- Catalog data intentionally starts empty. Categories and robot figures are
-- created by an owner/admin after signing in.
INSERT OR IGNORE INTO site_announcements(id, label, message, href, active, sort_order, starts_at, ends_at, created_at, updated_at) VALUES
  ('ann-shipping', 'BCE EXPRESS', 'Pengiriman pilihan untuk Jakarta dan Tangerang.', NULL, 1, 1, NULL, NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('ann-release', 'ROBOT FIGURES', 'Koleksi figure robot terbaru segera hadir.', '/search', 1, 2, NULL, NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
