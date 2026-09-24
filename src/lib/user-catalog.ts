import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { userCategories, userProducts, users, type ListItem } from "@/db/schema";
import { SEED_CATALOG } from "@/lib/catalog-data";

export type ProductDTO = {
  id: number;
  categoryId: number;
  name: string;
  selected: boolean;
  quantity: number;
  unit: string;
  sortOrder: number;
};

export type CategoryDTO = {
  id: number;
  name: string;
  icon: string;
  tint: string;
  sortOrder: number;
  products: ProductDTO[];
};

/**
 * Seed a *private* copy of the immutable application template exactly once.
 * Locking the users row serializes first requests even across server instances.
 * catalogInitialized is durable: a user who deletes all categories stays empty.
 */
export async function initializeUserCatalog(userId: number): Promise<void> {
  const [existing] = await db.select({ initialized: users.catalogInitialized })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) throw new Error("User does not exist");
  if (existing.initialized) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`);
    const [owner] = await tx
      .select({ initialized: users.catalogInitialized })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!owner) throw new Error("User does not exist");
    if (owner.initialized) return;

    for (const [order, seed] of SEED_CATALOG.entries()) {
      const [category] = await tx
        .insert(userCategories)
        .values({ userId, name: seed.name, icon: seed.icon, tint: seed.tint, sortOrder: order })
        .returning({ id: userCategories.id });
      if (seed.products.length > 0) {
        await tx.insert(userProducts).values(
          seed.products.map((product, index) => ({
            userId,
            categoryId: category.id,
            name: product.name,
            quantity: product.quantity,
            unit: product.unit,
            sortOrder: index,
          })),
        );
      }
    }
    await tx.update(users).set({ catalogInitialized: true }).where(eq(users.id, userId));
  });
}

/** Owner filter occurs in SQL on BOTH tables, not after fetching shared rows. */
export async function getUserCatalog(userId: number): Promise<CategoryDTO[]> {
  await initializeUserCatalog(userId);
  const [categories, products] = await Promise.all([
    db.select().from(userCategories).where(eq(userCategories.userId, userId))
      .orderBy(asc(userCategories.sortOrder), asc(userCategories.id)),
    db.select().from(userProducts).where(eq(userProducts.userId, userId))
      .orderBy(asc(userProducts.sortOrder), asc(userProducts.id)),
  ]);
  const byCategory = new Map<number, ProductDTO[]>();
  for (const product of products) {
    const group = byCategory.get(product.categoryId) ?? [];
    group.push({
      id: product.id, categoryId: product.categoryId, name: product.name,
      selected: false, quantity: product.quantity, unit: product.unit,
      sortOrder: product.sortOrder,
    });
    byCategory.set(product.categoryId, group);
  }
  return categories.map(({ id, name, icon, tint, sortOrder }) => ({
    id, name, icon, tint, sortOrder, products: byCategory.get(id) ?? [],
  }));
}

export async function addUserCategory(
  userId: number,
  input: { name: string; icon: string; tint: string },
): Promise<CategoryDTO> {
  await initializeUserCatalog(userId);
  const [last] = await db.select({ sortOrder: max(userCategories.sortOrder) })
    .from(userCategories).where(eq(userCategories.userId, userId));
  const [category] = await db.insert(userCategories).values({
    userId, ...input, sortOrder: (last?.sortOrder ?? -1) + 1,
  }).returning();
  return {
    id: category.id, name: category.name, icon: category.icon,
    tint: category.tint, sortOrder: category.sortOrder, products: [],
  };
}

export async function updateUserCategory(
  userId: number,
  categoryId: number,
  values: Partial<Pick<CategoryDTO, "name" | "icon" | "tint">>,
): Promise<CategoryDTO | null> {
  await initializeUserCatalog(userId);
  const [category] = await db.update(userCategories).set(values)
    .where(and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)))
    .returning();
  return category ? {
    id: category.id, name: category.name, icon: category.icon,
    tint: category.tint, sortOrder: category.sortOrder, products: [],
  } : null;
}

export async function deleteUserCategory(userId: number, categoryId: number): Promise<boolean> {
  await initializeUserCatalog(userId);
  const rows = await db.delete(userCategories)
    .where(and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)))
    .returning({ id: userCategories.id });
  // Database composite FK cascades only this category's products.
  return rows.length !== 0;
}

export async function addUserProduct(
  userId: number,
  input: { categoryId: number; name: string; quantity: number; unit: string },
): Promise<ProductDTO | null> {
  await initializeUserCatalog(userId);
  const [category] = await db.select({ id: userCategories.id }).from(userCategories)
    .where(and(eq(userCategories.id, input.categoryId), eq(userCategories.userId, userId)))
    .limit(1);
  if (!category) return null;

  const [last] = await db.select({ sortOrder: max(userProducts.sortOrder) })
    .from(userProducts)
    .where(and(eq(userProducts.userId, userId), eq(userProducts.categoryId, input.categoryId)));
  const [product] = await db.insert(userProducts)
    .values({ userId, ...input, sortOrder: (last?.sortOrder ?? -1) + 1 }).returning();
  return {
    id: product.id, categoryId: product.categoryId, name: product.name,
    selected: false, quantity: product.quantity, unit: product.unit,
    sortOrder: product.sortOrder,
  };
}

export async function updateUserProduct(
  userId: number,
  productId: number,
  values: Partial<Pick<ProductDTO, "name" | "quantity" | "unit" | "categoryId">>,
): Promise<ProductDTO | null> {
  await initializeUserCatalog(userId);
  if (values.categoryId !== undefined) {
    const [category] = await db.select({ id: userCategories.id }).from(userCategories)
      .where(and(eq(userCategories.id, values.categoryId), eq(userCategories.userId, userId)))
      .limit(1);
    if (!category) return null;
  }
  const [product] = await db.update(userProducts).set(values)
    .where(and(eq(userProducts.id, productId), eq(userProducts.userId, userId)))
    .returning();
  return product ? {
    id: product.id, categoryId: product.categoryId, name: product.name,
    selected: false, quantity: product.quantity, unit: product.unit,
    sortOrder: product.sortOrder,
  } : null;
}

export async function deleteUserProduct(userId: number, productId: number): Promise<boolean> {
  await initializeUserCatalog(userId);
  const rows = await db.delete(userProducts)
    .where(and(eq(userProducts.id, productId), eq(userProducts.userId, userId)))
    .returning({ id: userProducts.id });
  return rows.length !== 0;
}

export class InvalidListItemsError extends Error {
  constructor() {
    super("Items must reference products in your own catalogue");
  }
}

/**
 * Reject foreign/unknown product IDs before writing list JSON. Names and
 * category IDs come from owned database rows, not the browser's snapshot.
 * Selected quantity and unit are per-list and never modify user_products.
 */
export async function prepareUserListItems(userId: number, input: unknown): Promise<ListItem[]> {
  if (!Array.isArray(input) || input.length > 1000) throw new InvalidListItemsError();
  if (input.length === 0) return [];

  const ids: number[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object" || !Number.isSafeInteger(item.productId)
      || item.productId <= 0 || !Number.isInteger(item.quantity)
      || item.quantity < 1 || item.quantity > 1_000_000
      || typeof item.unit !== "string" || item.unit.trim().length < 1
      || item.unit.length > 20) throw new InvalidListItemsError();
    ids.push(item.productId);
  }
  if (new Set(ids).size !== ids.length) throw new InvalidListItemsError();

  const owned = await db.select({
    id: userProducts.id, categoryId: userProducts.categoryId, name: userProducts.name,
  }).from(userProducts)
    .where(and(eq(userProducts.userId, userId), inArray(userProducts.id, ids)));
  if (owned.length !== ids.length) throw new InvalidListItemsError();
  const byId = new Map(owned.map((product) => [product.id, product]));

  return input.map((item) => {
    const product = byId.get(item.productId);
    if (!product || item.categoryId !== product.categoryId) throw new InvalidListItemsError();
    return {
      productId: product.id, categoryId: product.categoryId, name: product.name,
      quantity: item.quantity, unit: item.unit.trim(),
    };
  });
}
