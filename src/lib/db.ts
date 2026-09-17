import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

/**
 * Thin D1 access layer for the OpenNext (Cloudflare) runtime.
 *
 * IMPORTANT: bindings must be accessed INSIDE handlers/components, never at
 * module top-level. The `db` proxy below defers `getCloudflareContext()`
 * until the first query actually runs (i.e. inside a request / cron handler).
 */

/** Create a drizzle instance bound to a D1 database. */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;

/**
 * D1 (SQLite) only enforces foreign keys when `PRAGMA foreign_keys = ON`
 * runs per connection. drizzle-orm/d1 does not enable it, and better-auth's
 * sqlite adapter requires it for cascade deletes (sessions/accounts cleanup).
 * Call once per D1 binding/connection.
 */
export async function initD1(d1: D1Database): Promise<void> {
  await d1.exec("PRAGMA foreign_keys = ON");
}

let injectedD1: D1Database | null = null;

/**
 * Explicitly provide the D1 binding. Used by `worker.ts`'s `scheduled`
 * handler, where there is no request context for `getCloudflareContext()`.
 */
export function setDb(d1: D1Database): void {
  injectedD1 = d1;
}

/**
 * Resolve the D1 binding and return a drizzle instance.
 * - In request handlers: `getCloudflareContext().env.DB` (set up by OpenNext).
 * - In cron handlers: the binding injected via `setDb(env.DB)`.
 */
export function getDb(): Database {
  const d1 = injectedD1 ?? getCloudflareContext().env.DB;
  if (!d1) {
    throw new Error(
      "[db] No D1 binding available. In a request, ensure the DB binding is configured in wrangler.jsonc; in a cron handler, call setDb(env.DB) first.",
    );
  }
  return createDb(d1);
}

// Keep `initD1` idempotent-friendly: call sites may run it on every
// connection they create (wrangler dev uses a fresh local D1 per session).

/**
 * Lazy `db` for services/cron ported from the Express app (they all use
 * `import { db } from "@/lib/db"`). The proxy resolves the D1 binding on
 * first property access, i.e. inside the calling handler.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, _receiver) {
    const d = getDb();
    const value = Reflect.get(d, prop, d);
    return typeof value === "function" ? value.bind(d) : value;
  },
  set(_target, prop, value, _receiver) {
    const d = getDb();
    return Reflect.set(d, prop, value, d);
  },
});
