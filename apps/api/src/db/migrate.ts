/**
 * D1 migration bootstrap — replaces the old PostgreSQL migrator.
 *
 * D1 schema migrations are applied out-of-band with:
 *   wrangler d1 migrations apply <database>
 * (generated via `drizzle-kit generate` with the sqlite dialect).
 *
 * There is no runtime migration step anymore. The PostgreSQL extension
 * bootstrap (`CREATE EXTENSION pgcrypto/citext`) is gone: UUIDs are generated
 * with `crypto.randomUUID()` via `$defaultFn` in `schema.ts`, and
 * case-insensitive emails use `COLLATE NOCASE` on the sqlite text columns.
 *
 * `runMigrations` is kept as a no-op so the Express boot sequence in
 * `server.ts` still compiles; the Cloudflare entrypoint task replaces that
 * boot path entirely.
 */
export async function runMigrations(): Promise<void> {
  console.log(
    "[db/migrate] No-op: D1 migrations are applied via `wrangler d1 migrations apply`. Skipping runtime migrations.",
  );
}