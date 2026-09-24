import "dotenv/config";
import assert from "node:assert/strict";
import { pool } from "../src/db";
import { getUserCatalog } from "../src/lib/user-catalog";
import { getUserActiveList } from "../src/lib/catalog";

async function main() {
  const [aId, bId, privateProductName] = process.argv.slice(2);
  const a = Number(aId);
  const b = Number(bId);
  assert.ok(Number.isSafeInteger(a) && Number.isSafeInteger(b) && privateProductName);

  const [catalogueA, catalogueB, listA, listB] = await Promise.all([
    getUserCatalog(a), getUserCatalog(b), getUserActiveList(a), getUserActiveList(b),
  ]);
  assert.ok(catalogueA.some((c) => c.products.some((p) => p.name === privateProductName)));
  assert.ok(!catalogueB.some((c) => c.products.some((p) => p.name === privateProductName)));
  assert.equal(listA.items[0].quantity, 5);
  assert.equal(listB.items[0].name, "Oil");
  console.log("PASS 10: private catalogues and lists persist in a new server process");
}

main().then(() => pool.end()).catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
