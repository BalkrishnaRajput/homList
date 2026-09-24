import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Archived pre-isolation catalogue. Kept in the database to preserve existing
// data and map saved list JSON during migration. Application routes never use it.
export const legacyCategories = pgTable("categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("grid"),
  tint: text("tint").notNull().default("#EDEFF2"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const legacyProducts = pgTable("products", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => legacyCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unit: text("unit").notNull().default("kg"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Supabase Auth supplies the verified subject; src/lib/auth.ts maps it to this
// existing numeric application ID. No second user or authentication table.
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  email: text("email").unique(),
  authSubject: text("auth_subject").unique(),
  developmentKey: text("development_key").unique(),
  catalogInitialized: boolean("catalog_initialized").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;

// This is the catalogue the user can edit. IDs are generated globally across
// all users (not reused per user); ownership is still checked in every query.
export const userCategories = pgTable(
  "user_categories",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("grid"),
    tint: text("tint").notNull().default("#EDEFF2"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("user_categories_user_id_idx").on(table.userId),
    unique("user_categories_id_user_id_unique").on(table.id, table.userId),
  ],
);

export const userProducts = pgTable(
  "user_products",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(1), // default, not list selection
    unit: text("unit").notNull().default("kg"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("user_products_user_category_idx").on(table.userId, table.categoryId),
    // Prevent a product owned by A from referring to a category owned by B.
    foreignKey({
      name: "user_products_category_owner_fk",
      columns: [table.categoryId, table.userId],
      foreignColumns: [userCategories.id, userCategories.userId],
    }).onDelete("cascade"),
  ],
);

export type CategoryRow = typeof userCategories.$inferSelect;
export type ProductRow = typeof userProducts.$inferSelect;

// IDs refer to user_categories/user_products, not the legacy shared catalogue.
// The name/quantity/unit snapshot is retained when a catalogue item is deleted.
export type ListItem = {
  productId: number;
  categoryId: number;
  name: string;
  quantity: number;
  unit: string;
};

export const shoppingLists = pgTable(
  "shopping_lists",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    legacyUserId: text("legacy_user_id"),
    title: text("title").notNull().default("My Shopping List"),
    notes: text("notes").notNull().default(""),
    items: jsonb("items").$type<ListItem[]>().notNull().default([]),
    itemCount: integer("item_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("shopping_lists_user_id_idx").on(table.userId)],
);

export type ShoppingListRow = typeof shoppingLists.$inferSelect;
