import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("afrocart_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  origin: text("origin").notNull(),
  imageUrl: text("image_url").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersTable = pgTable("afrocart_orders", {
  id: serial("id").primaryKey(),
  customerUserId: text("customer_user_id"),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address").notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("awaiting_payment"),
  paymentMethod: text("payment_method").notNull().default("bank"),
  paymentDetails: text("payment_details").notNull().default(""),
  paymentReference: text("payment_reference").notNull().default(""),
  paymentStatus: text("payment_status").notNull().default("received"),
  riderName: text("rider_name"),
  riderType: text("rider_type").notNull().default("unassigned"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  eta: text("eta").notNull(),
  events: jsonb("events").notNull(),
});

export const ridersTable = pgTable("afrocart_riders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("available"),
  phone: text("phone").notNull(),
  activeOrders: integer("active_orders").notNull().default(0),
});

export const notificationsTable = pgTable("afrocart_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  time: text("time").notNull(),
  kind: text("kind").notNull(),
  read: boolean("read").notNull().default(false),
  audience: text("audience").notNull().default("all"),
  recipientUserId: text("recipient_user_id"),
});

export const paymentMethodsTable = pgTable("afrocart_payment_methods", {
  method: text("method").primaryKey(),
  label: text("label").notNull(),
  details: text("details").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoriesTable = pgTable("afrocart_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export const insertRiderSchema = createInsertSchema(ridersTable).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type Rider = typeof ridersTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type PaymentMethod = typeof paymentMethodsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;