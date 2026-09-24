import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// DATABASE_URL is the authoritative Drizzle connection. DIRECT_URL may be used
// by operators with a separate direct/pooler pair, but is never required by
// application runtime and is never exposed to the browser.
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to generate or apply migrations");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: databaseUrl,
  },
});
