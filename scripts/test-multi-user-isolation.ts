import "dotenv/config";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  legacyCategories, legacyProducts, shoppingLists, userCategories,
  userProducts, users, type ListItem,
} from "../src/db/schema";
import { SEED_CATALOG } from "../src/lib/catalog-data";
import {
  deleteUserList, getUserActiveList, getUserListById, getUserListHistory,
  saveUserActiveList, saveUserListSnapshot, updateUserListTitle,
} from "../src/lib/catalog";
import {
  addUserCategory, addUserProduct, deleteUserCategory, deleteUserProduct,
  getUserCatalog, initializeUserCatalog, InvalidListItemsError,
  updateUserCategory, updateUserProduct,
} from "../src/lib/user-catalog";
import {
  UnauthenticatedError, authenticationErrorResponse, mapAuthenticatedUser,
} from "../src/lib/auth";

async function runTests() {
  const created: number[] = [];
  console.log("=== PRIVATE CATALOGUE AND LIST ISOLATION ===");
  try {
    const [oldCategories, oldProducts] = await Promise.all([
      db.select().from(legacyCategories), db.select().from(legacyProducts),
    ]);
    // L: a verified subject maps to exactly one numeric application user.
    const subjectA = randomUUID();
    const emailA = `${subjectA}@example.test`;
    const firstA = await mapAuthenticatedUser({ id: subjectA, email: emailA });
    const secondA = await mapAuthenticatedUser({
      id: subjectA, email: emailA.toUpperCase(),
    });
    assert.deepEqual(firstA, secondA);
    const rowsForA = await db.select({ id: users.id }).from(users)
      .where(eq(users.authSubject, subjectA));
    assert.equal(rowsForA.length, 1);
    assert.equal(rowsForA[0].id, firstA.userId);
    const a = { id: firstA.userId };
    created.push(a.id);

    // M: a different verified subject maps to a different application user.
    const subjectB = randomUUID();
    const firstB = await mapAuthenticatedUser({ id: subjectB });
    const rowsForB = await db.select({ id: users.id }).from(users)
      .where(eq(users.authSubject, subjectB));
    assert.equal(rowsForB.length, 1);
    const b = { id: firstB.userId };
    created.push(b.id);
    assert.ok(Number.isInteger(a.id) && Number.isInteger(b.id) && a.id !== b.id);

    // J's response contract is centralized: no handler can forget the 401.
    assert.equal(authenticationErrorResponse(new UnauthenticatedError())?.status, 401);
    console.log("PASS L/M: subjects map idempotently to distinct numeric users");
    console.log("PASS J contract: unauthenticated boundary returns HTTP 401");

    // 1 & 2: a fresh copy of the immutable seed for every new owner.
    const [initialA, initialB] = await Promise.all([getUserCatalog(a.id), getUserCatalog(b.id)]);
    const expected = SEED_CATALOG.map((seed, order) => ({
      name: seed.name, icon: seed.icon, tint: seed.tint, sortOrder: order,
      products: seed.products.map((p, sortOrder) => ({
        name: p.name, quantity: p.quantity, unit: p.unit, sortOrder,
      })),
    }));
    const comparable = (catalogue: typeof initialA) => catalogue.map((c) => ({
      name: c.name, icon: c.icon, tint: c.tint, sortOrder: c.sortOrder,
      products: c.products.map((p) => ({
        name: p.name, quantity: p.quantity, unit: p.unit, sortOrder: p.sortOrder,
      })),
    }));
    assert.deepEqual(comparable(initialA), expected);
    assert.deepEqual(comparable(initialB), expected);
    assert.notEqual(initialA[0].id, initialB[0].id);
    assert.notEqual(initialA[0].products[0].id, initialB[0].products[0].id);
    console.log("PASS 1-2: independent complete starter catalogues, identical defaults");

    // 3 & 4: independent category additions.
    const categoryA = await addUserCategory(a.id, { name: "A Private Category", icon: "grid", tint: "#EAF3EC" });
    assert.ok(!(await getUserCatalog(b.id)).some((c) => c.name === categoryA.name));
    const categoryB = await addUserCategory(b.id, { name: "B Private Category", icon: "grid", tint: "#EAF3EC" });
    assert.ok(!(await getUserCatalog(a.id)).some((c) => c.name === categoryB.name));
    console.log("PASS 3-4: A and B add separate categories");

    // 5: cascading delete of one owner's category must leave B's intact.
    const aSpices = initialA.find((c) => c.name === "Spices")!;
    const bSpices = initialB.find((c) => c.name === "Spices")!;
    assert.equal(await deleteUserCategory(a.id, aSpices.id), true);
    assert.ok(!(await getUserCatalog(a.id)).some((c) => c.name === "Spices"));
    assert.equal((await getUserCatalog(b.id)).find((c) => c.id === bSpices.id)?.products.length, bSpices.products.length);
    assert.equal(await deleteUserCategory(a.id, bSpices.id), false);
    assert.equal(await updateUserCategory(a.id, bSpices.id, { name: "Hacked" }), null);
    console.log("PASS 5: A deletes Spices, B's Spices and products remain");

    // 6: product additions, updates, moves and deletes cannot cross owner.
    const productA = await addUserProduct(a.id, {
      categoryId: categoryA.id, name: "A Private Product", quantity: 9, unit: "pc",
    });
    assert.ok(productA);
    assert.ok(!(await getUserCatalog(b.id)).flatMap((c) => c.products).some((p) => p.id === productA.id));
    assert.equal(await addUserProduct(b.id, { categoryId: categoryA.id, name: "Wrong owner", quantity: 1, unit: "pc" }), null);
    assert.equal(await updateUserProduct(b.id, productA.id, { name: "Hacked" }), null);
    assert.equal(await updateUserProduct(a.id, productA.id, { categoryId: categoryB.id }), null);
    assert.equal(await deleteUserProduct(b.id, productA.id), false);
    await assert.rejects(
      db.insert(userProducts).values({
        userId: b.id, categoryId: categoryA.id, name: "Invalid FK", quantity: 1, unit: "pc",
      }),
      (error: unknown) => (error as { cause?: { code?: string } })?.cause?.code === "23503",
    );
    console.log("PASS 6: A product hidden from B; cross-user writes and FK rejected");

    // 7: selected items/quantities/notes belong only to their list owner.
    const rice = initialA.flatMap((c) => c.products).find((p) => p.name === "Rice")!;
    const oil = initialB.flatMap((c) => c.products).find((p) => p.name === "Oil")!;
    const riceItem: ListItem = {
      productId: rice.id, categoryId: rice.categoryId,
      name: rice.name, quantity: 2, unit: rice.unit,
    };
    const oilItem: ListItem = {
      productId: oil.id, categoryId: oil.categoryId,
      name: oil.name, quantity: 1, unit: oil.unit,
    };
    await saveUserActiveList(a.id, [riceItem], "A private notes");
    assert.deepEqual((await getUserActiveList(b.id)).items, []);
    await saveUserActiveList(b.id, [oilItem], "B private notes");
    await saveUserActiveList(a.id, [{ ...riceItem, quantity: 5, name: "forged name" }], "A edited");
    assert.equal((await getUserActiveList(a.id)).items[0].quantity, 5);
    assert.equal((await getUserActiveList(a.id)).items[0].name, rice.name);
    assert.deepEqual((await getUserActiveList(b.id)).items, [oilItem]);
    await assert.rejects(saveUserActiveList(b.id, [riceItem], "forged"), InvalidListItemsError);
    assert.deepEqual((await getUserActiveList(b.id)).items, [oilItem]);
    console.log("PASS 7: selections, changed quantities, notes and names isolated");

    // 8 & 9: saved lists are scoped by user AND ID, including update/delete.
    const snapshotA = await saveUserListSnapshot(a.id, "A private", "A notes", [riceItem]);
    const snapshotB = await saveUserListSnapshot(b.id, "B private", "B notes", [oilItem]);
    assert.ok(!(await getUserListHistory(b.id)).some((l) => l.id === snapshotA.id));
    assert.equal(await getUserListById(b.id, snapshotA.id), null);
    assert.equal(await updateUserListTitle(b.id, snapshotA.id, "hijacked"), null);
    assert.equal(await deleteUserList(b.id, snapshotA.id), false);
    assert.equal((await getUserListById(a.id, snapshotA.id))?.title, "A private");
    assert.equal((await getUserListById(a.id, snapshotB.id)), null);
    await assert.rejects(saveUserListSnapshot(b.id, "forged", "", [riceItem]), InvalidListItemsError);
    console.log("PASS 8-9: saved history and direct access protected");

    // 10: separate process = fresh module instance, independent DB connection.
    const verified = spawnSync(process.execPath, [
      "--import", "tsx", "scripts/verify-catalog-persistence.ts",
      String(a.id), String(b.id), productA.name,
    ], { encoding: "utf8", timeout: 30_000, env: process.env });
    assert.equal(verified.status, 0, verified.stderr || verified.stdout);
    console.log(verified.stdout.trim());

    // 11: repeated/concurrent initialization does not duplicate rows.
    const [beforeA] = await db.select({ count: sqlCount() }).from(userCategories).where(eq(userCategories.userId, a.id));
    await Promise.all(Array.from({ length: 8 }, () => initializeUserCatalog(a.id)));
    const [afterA] = await db.select({ count: sqlCount() }).from(userCategories).where(eq(userCategories.userId, a.id));
    assert.equal(afterA.count, beforeA.count);
    const mappedC = await mapAuthenticatedUser({ id: randomUUID() });
    const c = { id: mappedC.userId };
    created.push(c.id);
    await Promise.all(Array.from({ length: 8 }, () => initializeUserCatalog(c.id)));
    assert.equal((await getUserCatalog(c.id)).length, SEED_CATALOG.length);
    await db.delete(userCategories).where(eq(userCategories.userId, c.id));
    assert.deepEqual(await getUserCatalog(c.id), []);
    console.log("PASS 10-11: fresh-process persistence, concurrent init, deleted-empty remains empty");

    // Neither private mutation nor list save ever changes the archived table.
    assert.deepEqual(await db.select().from(legacyCategories), oldCategories);
    assert.deepEqual(await db.select().from(legacyProducts), oldProducts);
    console.log("PASS: archived global catalogue unchanged");
    console.log("=== ALL PRIVATE-CATALOGUE ISOLATION TESTS PASSED ===");
  } finally {
    if (created.length) {
      await db.delete(shoppingLists).where(inArray(shoppingLists.userId, created));
      await db.delete(users).where(inArray(users.id, created)); // private catalogue cascades
    }
    await pool.end();
  }
}

// PostgreSQL count is returned as a number with a stable explicit cast.
function sqlCount() {
  return sql<number>`count(*)::integer`;
}

runTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
