import "dotenv/config";
import assert from "node:assert/strict";
import { createClient, type Session } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../src/db";
import { shoppingLists, users } from "../src/db/schema";
import { tryGetSupabasePublicConfig } from "../src/lib/supabase/config";

const origin = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";

type Reply = {
  status: number;
  data: Record<string, any>;
  response: Response;
};

type CallOptions = {
  method?: string;
  body?: unknown;
  cookie?: string;
  token?: string;
  headers?: Record<string, string>;
};

async function call(path: string, options: CallOptions = {}): Promise<Reply> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.cookie) headers.Cookie = options.cookie;
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(new URL(path, origin), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const text = await response.text();
  let data: Record<string, any> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, any>;
    } catch {
      data = { raw: text };
    }
  }
  return { status: response.status, data, response };
}

function sessionCookie(session: Session): string {
  const config = tryGetSupabasePublicConfig();
  if (!config) throw new Error("Supabase public configuration is missing");
  const projectRef = new URL(config.url).hostname.split(".")[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;
  return createChunks(storageKey, encoded)
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function anonymousSession(label: string): Promise<Session> {
  const config = tryGetSupabasePublicConfig();
  if (!config) throw new Error("Supabase public configuration is missing");
  const client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(
      `Could not create Supabase test identity ${label}: ${error?.message ?? "no session"}. `
      + "Enable the anonymous sign-in provider to run authenticated HTTP isolation tests.",
    );
  }
  return data.session;
}

const privateRequests: { path: string; options: CallOptions }[] = [
  { path: "/api/catalog", options: {} },
  { path: "/api/categories", options: {} },
  { path: "/api/categories", options: { method: "POST", body: { name: "forged" } } },
  { path: "/api/categories/1", options: { method: "PATCH", body: { name: "forged" } } },
  { path: "/api/categories/1", options: { method: "DELETE" } },
  { path: "/api/products", options: {} },
  { path: "/api/products", options: { method: "POST", body: { categoryId: 1, name: "forged" } } },
  { path: "/api/products/1", options: { method: "PATCH", body: { name: "forged" } } },
  { path: "/api/products/1", options: { method: "DELETE" } },
  { path: "/api/list", options: {} },
  { path: "/api/list", options: { method: "PUT", body: { items: [] } } },
  { path: "/api/lists", options: {} },
  { path: "/api/lists", options: { method: "POST", body: { items: [] } } },
  { path: "/api/lists/not-owned", options: { method: "PATCH", body: { title: "forged" } } },
  { path: "/api/lists/not-owned", options: { method: "DELETE" } },
];

async function main() {
  console.log("=== SUPABASE AUTH API ISOLATION ===");

  // N: production has no development identity endpoints.
  const [devUser, devSwitch, health] = await Promise.all([
    call("/api/dev/user"),
    call("/api/dev/switch-user", { method: "POST", body: { userId: "dev-user-a" } }),
    call("/api/health"),
  ]);
  assert.equal(devUser.status, 404);
  assert.equal(devSwitch.status, 404);
  assert.equal(health.status, 200);
  console.log("PASS N: /api/dev/* removed; health route remains public");

  let config;
  try {
    config = tryGetSupabasePublicConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
    return;
  }

  if (!config) {
    console.error(
      "BLOCKED: NEXT_PUBLIC_SUPABASE_URL and a public Supabase key are not configured. "
      + "Unauthenticated 401 and authenticated A-M HTTP tests cannot reach Supabase Auth.",
    );
    process.exitCode = 2;
    return;
  }

  // J: every private route rejects before parsing body or touching database.
  for (const request of privateRequests) {
    const reply = await call(request.path, request.options);
    assert.equal(
      reply.status, 401,
      `${request.options.method ?? "GET"} ${request.path} returned ${reply.status}`,
    );
  }
  const devCookie = await call("/api/catalog", { cookie: "dev_user_id=dev-user-a" });
  const forgedQuery = await call("/api/catalog?userId=1", { cookie: "dev_user_id=dev-user-b" });
  const invalidToken = await call("/api/catalog", { token: "not-a-valid-jwt" });
  assert.equal(devCookie.status, 401);
  assert.equal(forgedQuery.status, 401);
  assert.equal(invalidToken.status, 401);
  assert.equal((await call("/api/catalog", {
    headers: { "x-dev-user-id": "dev-user-a" },
  })).status, 401);
  console.log("PASS J/N: protected APIs return 401; dev cookie/header/query ignored");

  const cleanupSubjects: string[] = [];
  try {
    const [sessionA, sessionB] = await Promise.all([
      anonymousSession("A"), anonymousSession("B"),
    ]);
    assert.notEqual(sessionA.user.id, sessionB.user.id);
    cleanupSubjects.push(sessionA.user.id, sessionB.user.id);
    const cookieA = sessionCookie(sessionA);
    const cookieB = sessionCookie(sessionB);

    // A and B each read their own complete catalogue.
    const [catalogAFirst, catalogBFirst] = await Promise.all([
      call("/api/catalog", { cookie: cookieA }),
      call("/api/catalog", { cookie: cookieB }),
    ]);
    assert.equal(catalogAFirst.status, 200);
    assert.equal(catalogBFirst.status, 200);
    assert.ok(catalogAFirst.data.categories.length > 0);
    assert.ok(catalogBFirst.data.categories.length > 0);
    console.log("PASS A/B: each authenticated user reads an independent private catalogue");

    const rowsA = await db.select({ id: users.id }).from(users)
      .where(eq(users.authSubject, sessionA.user.id));
    const rowsB = await db.select({ id: users.id }).from(users)
      .where(eq(users.authSubject, sessionB.user.id));
    assert.equal(rowsA.length, 1);
    assert.equal(rowsB.length, 1);
    assert.notEqual(rowsA[0].id, rowsB[0].id);

    // C: A cannot obtain B's catalogue even with forged query identity.
    const catalogAAgain = await call(
      `/api/catalog?userId=${rowsB[0].id}&user_id=${rowsB[0].id}`,
      { cookie: cookieA },
    );
    assert.equal(catalogAAgain.status, 200);
    const idsA = new Set<number>(
      catalogAAgain.data.categories.map((category: { id: number }) => category.id),
    );
    const idsB = new Set<number>(
      catalogBFirst.data.categories.map((category: { id: number }) => category.id),
    );
    assert.ok([...idsB].every((id) => !idsA.has(id)));
    assert.notDeepEqual([...idsA].sort(), [...idsB].sort());

    // D/E: cross-user category and product mutations are not found.
    const createdCategoryB = await call("/api/categories", {
      method: "POST",
      cookie: cookieB,
      body: {
        name: "B Private HTTP Category", icon: "grid", tint: "#EAF3EC",
        userId: rowsA[0].id,
      },
    });
    assert.equal(createdCategoryB.status, 201);
    const categoryB = createdCategoryB.data.category.id as number;
    assert.equal((await call(`/api/categories/${categoryB}`, {
      method: "PATCH", cookie: cookieA, body: { name: "Hijacked by A" },
    })).status, 404);
    assert.equal((await call(`/api/categories/${categoryB}`, {
      method: "DELETE", cookie: cookieA,
    })).status, 404);

    const createdProductB = await call("/api/products", {
      method: "POST",
      cookie: cookieB,
      body: {
        categoryId: categoryB, name: "B Private HTTP Product",
        quantity: 4, unit: "pc", userId: rowsA[0].id,
      },
    });
    assert.equal(createdProductB.status, 201);
    const productB = createdProductB.data.product.id as number;
    assert.equal((await call("/api/products", {
      method: "POST", cookie: cookieA,
      body: { categoryId: categoryB, name: "Cross owner", quantity: 1, unit: "pc" },
    })).status, 404);
    assert.equal((await call(`/api/products/${productB}`, {
      method: "PATCH", cookie: cookieA, body: { name: "Hijacked by A" },
    })).status, 404);
    assert.equal((await call(`/api/products/${productB}`, {
      method: "DELETE", cookie: cookieA,
    })).status, 404);
    const productsA = await call("/api/products", { cookie: cookieA });
    assert.ok(!productsA.data.products.some((p: { id: number }) => p.id === productB));
    console.log("PASS C-E: A cannot read or modify B's categories/products");

    // F-H: A's saved list is invisible and immutable for B.
    const firstCategoryA = catalogAAgain.data.categories[0];
    const firstProductA = firstCategoryA.products[0];
    assert.ok(firstProductA);
    const itemA = {
      productId: firstProductA.id,
      categoryId: firstCategoryA.id,
      name: "forged name",
      quantity: 6,
      unit: "pc",
    };
    const createdListA = await call("/api/lists", {
      method: "POST",
      cookie: cookieA,
      body: {
        title: "A Private HTTP List",
        notes: "A notes",
        items: [itemA],
        userId: rowsB[0].id,
      },
    });
    assert.equal(createdListA.status, 201);
    const listA = createdListA.data.list.id as string;
    assert.equal(createdListA.data.list.userId, rowsA[0].id);
    assert.equal(createdListA.data.list.items[0].name, firstProductA.name);

    assert.equal((await call(`/api/lists/${listA}`, { cookie: cookieB })).status, 404);
    assert.equal((await call(`/api/lists/${listA}`, {
      method: "PATCH", cookie: cookieB, body: { title: "Hijacked by B" },
    })).status, 404);
    assert.equal((await call(`/api/lists/${listA}`, {
      method: "DELETE", cookie: cookieB,
    })).status, 404);
    const historyB = await call("/api/lists", { cookie: cookieB });
    assert.ok(!historyB.data.lists.some((list: { id: string }) => list.id === listA));
    console.log("PASS F-H: B cannot read, update, or delete A's shopping list");

    // I: a list submission containing a foreign product ID is rejected.
    const foreignActive = await call("/api/list", {
      method: "PUT", cookie: cookieB, body: { items: [itemA], userId: rowsA[0].id },
    });
    const foreignSnapshot = await call("/api/lists", {
      method: "POST", cookie: cookieB, body: { items: [itemA], userId: rowsA[0].id },
    });
    assert.equal(foreignActive.status, 400);
    assert.equal(foreignSnapshot.status, 400);
    console.log("PASS I: foreign product IDs rejected with HTTP 400");

    // L: repeat calls reuse exactly one users row for B's verified subject.
    const catalogBSecond = await call(
      `/api/catalog?userId=${rowsA[0].id}`,
      { cookie: cookieB },
    );
    assert.equal(catalogBSecond.status, 200);
    const rowsBAgain = await db.select({ id: users.id }).from(users)
      .where(eq(users.authSubject, sessionB.user.id));
    assert.equal(rowsBAgain.length, 1);
    assert.equal(rowsBAgain[0].id, rowsB[0].id);
    console.log("PASS L: repeat login maps to the same numeric users.id");

    // M: both start from equal starter catalogues, then diverge independently.
    assert.equal(
      catalogAAgain.data.categories.length,
      catalogBFirst.data.categories.length,
    );
    assert.equal(
      catalogBSecond.data.categories.length,
      catalogBFirst.data.categories.length + 1,
    );
    assert.ok(catalogBSecond.data.categories.some((c: { id: number }) => c.id === categoryB));
    assert.ok(!catalogAAgain.data.categories.some((c: { id: number }) => c.id === categoryB));
    console.log("PASS M: two authenticated users have independent private catalogues");

    // K: global sign-out revokes A's server session and removes access.
    const signOut = await call("/api/auth/sign-out", { method: "POST", cookie: cookieA });
    assert.equal(signOut.status, 204);
    assert.equal((await call("/api/catalog", { cookie: cookieA })).status, 401);
    assert.equal((await call("/api/list", { cookie: cookieA })).status, 401);
    console.log("PASS K: after sign-out the same session cookies return 401");

    console.log("=== ALL SUPABASE AUTH HTTP TESTS PASSED ===");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not create Supabase test identity")) {
      console.error(`BLOCKED: ${error.message}`);
      process.exitCode = 2;
    } else {
      throw error;
    }
  } finally {
    if (cleanupSubjects.length) {
      const owned = await db.select({ id: users.id }).from(users)
        .where(inArray(users.authSubject, cleanupSubjects));
      const ownedIds = owned.map((row) => row.id);
      if (ownedIds.length) {
        await db.delete(shoppingLists).where(inArray(shoppingLists.userId, ownedIds));
        await db.delete(users).where(inArray(users.id, ownedIds));
      }
    }
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
