PRAGMA foreign_keys = ON;

-- Remove only catalog records that belonged to the temporary migration demo.
-- Child variants and images are deleted through their product foreign keys.
DELETE FROM products
WHERE id IN ('prd-arka-bima', 'prd-kuro', 'prd-orbit', 'prd-rover');

-- Keep a demo category if an operator has already attached a real product to it.
DELETE FROM categories
WHERE id IN ('cat-figure', 'cat-chibi', 'cat-designer')
  AND NOT EXISTS (SELECT 1 FROM products WHERE products.category_id = categories.id);
