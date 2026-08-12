import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull(),
  createdAt: text("created_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  published: integer("published", { mode: "boolean" }).notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productVariants = sqliteTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  regularPrice: integer("regular_price").notNull(),
  salePrice: integer("sale_price"),
  stockOnHand: integer("stock_on_hand").notNull(),
  reservedStock: integer("reserved_stock").notNull(),
  shippingWeightGrams: integer("shipping_weight_grams").notNull(),
  active: integer("active", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const siteAnnouncements = sqliteTable("site_announcements", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  message: text("message").notNull(),
  href: text("href"),
  active: integer("active", { mode: "boolean" }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
