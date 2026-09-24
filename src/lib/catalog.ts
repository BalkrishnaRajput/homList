import { randomUUID } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { shoppingLists, type ShoppingListRow } from "@/db/schema";
import { prepareUserListItems } from "@/lib/user-catalog";

// Keep existing client-side DTO imports stable while catalogue reads move to
// the user-owned repository. There are no runtime reads from the legacy tables.
export type { ListItem } from "@/db/schema";
export type { CategoryDTO, ProductDTO } from "@/lib/user-catalog";

const listColumns = {
  id: shoppingLists.id,
  userId: shoppingLists.userId,
  title: shoppingLists.title,
  notes: shoppingLists.notes,
  items: shoppingLists.items,
  itemCount: shoppingLists.itemCount,
  createdAt: shoppingLists.createdAt,
  updatedAt: shoppingLists.updatedAt,
};

export type ListSnapshot = Omit<ShoppingListRow, "legacyUserId">;

export function getUserCurrentListId(userId: number): string {
  return `current_${userId}`;
}

export async function getUserActiveList(userId: number): Promise<ListSnapshot> {
  const id = getUserCurrentListId(userId);
  const whereOwner = and(eq(shoppingLists.id, id), eq(shoppingLists.userId, userId));
  const [existing] = await db.select(listColumns).from(shoppingLists).where(whereOwner).limit(1);
  if (existing) return existing;

  await db.insert(shoppingLists).values({ id, userId }).onConflictDoNothing();
  const [list] = await db.select(listColumns).from(shoppingLists).where(whereOwner).limit(1);
  if (!list) throw new Error("Current list ID is unavailable for this user");
  return list;
}

/** Only this owner can upsert this draft; products are validated server-side. */
export async function saveUserActiveList(
  userId: number,
  input: unknown,
  notes: string,
): Promise<{ ok: true; itemCount: number }> {
  const items = await prepareUserListItems(userId, input);
  const id = getUserCurrentListId(userId);
  const [saved] = await db.insert(shoppingLists)
    .values({ id, userId, notes, items, itemCount: items.length, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: shoppingLists.id,
      set: { items, notes, itemCount: items.length, updatedAt: new Date() },
      where: eq(shoppingLists.userId, userId),
    })
    .returning({ id: shoppingLists.id });
  if (!saved) throw new Error("Current list ID is unavailable for this user");
  return { ok: true, itemCount: items.length };
}

export async function getUserListHistory(userId: number): Promise<ListSnapshot[]> {
  return db.select(listColumns).from(shoppingLists)
    .where(and(eq(shoppingLists.userId, userId), ne(shoppingLists.id, getUserCurrentListId(userId))))
    .orderBy(desc(shoppingLists.updatedAt));
}

export async function getUserListById(
  userId: number,
  listId: string,
): Promise<ListSnapshot | null> {
  const [list] = await db.select(listColumns).from(shoppingLists)
    .where(and(eq(shoppingLists.userId, userId), eq(shoppingLists.id, listId)))
    .limit(1);
  return list ?? null;
}

export async function saveUserListSnapshot(
  userId: number,
  title: string,
  notes: string,
  input: unknown,
): Promise<ListSnapshot> {
  const items = await prepareUserListItems(userId, input);
  const [list] = await db.insert(shoppingLists)
    .values({
      id: `list_${randomUUID()}`, userId,
      title: title || "My Shopping List", notes,
      items, itemCount: items.length,
    }).returning(listColumns);
  return list;
}

export async function updateUserListTitle(
  userId: number,
  listId: string,
  title: string,
): Promise<ListSnapshot | null> {
  if (listId === getUserCurrentListId(userId)) return null;
  const [list] = await db.update(shoppingLists).set({ title, updatedAt: new Date() })
    .where(and(eq(shoppingLists.userId, userId), eq(shoppingLists.id, listId)))
    .returning(listColumns);
  return list ?? null;
}

export async function deleteUserList(userId: number, listId: string): Promise<boolean> {
  if (listId === getUserCurrentListId(userId)) return false;
  const rows = await db.delete(shoppingLists)
    .where(and(eq(shoppingLists.userId, userId), eq(shoppingLists.id, listId)))
    .returning({ id: shoppingLists.id });
  return rows.length > 0;
}
