import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    // Local file used by drizzle-kit to generate/verify migrations.
    // Deployed schema changes are applied to D1 via `wrangler d1 migrations apply`.
    url: "file:./d1.db",
  },
});
