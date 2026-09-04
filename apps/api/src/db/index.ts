import * as schema from "./schema";
import { drizzle } from "drizzle-orm/d1";

/**
 * Minimal structural types for a Cloudflare D1 binding.
 *
 * These mirror the shapes from `@cloudflare/workers-types` (which is not
 * installed in this Express app). A real `D1Database` binding satisfies
 * them structurally, so `createDb(env.DB)` works once the Cloudflare
 * entrypoint lands without any casts.
 */

export interface D1ResultLike<T = unknown> {
  results?: T;
  success: boolean;
  meta: Record<string, unknown> & {
    duration?: number;
    changes?: number;
    last_row_id?: number;
    served_by?: string;
    internal_stats?: unknown;
  };
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(...values: unknown[]): Promise<T | null>;
  run<T = unknown>(...values: unknown[]): Promise<D1ResultLike<T>>;
  all<T = unknown>(...values: unknown[]): Promise<D1ResultLike<T[]>>;
  raw<T = unknown>(...values: unknown[]): Promise<T[]>;
}

export interface D1DatabaseLike {
  prepare(query: string, ...params: unknown[]): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1ResultLike<T>[]>;
  exec(query: string): Promise<D1ResultLike>;
}

/**
 * Create a drizzle instance bound to a Cloudflare D1 database.
 *
 * The Cloudflare entrypoint should call:
 *   export const db = createDb(env.DB);
 * and then `await initD1(env.DB)`.
 */
export function createDb(d1: D1DatabaseLike) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;

/**
 * D1 (SQLite) only enforces foreign keys when `PRAGMA foreign_keys = ON`
 * runs per connection. drizzle-orm/d1 does not enable it, and better-auth's
 * sqlite adapter requires it for cascade deletes (sessions/accounts cleanup).
 * Call this once at the entrypoint, right after `createDb(env.DB)`.
 */
export async function initD1(d1: D1DatabaseLike): Promise<void> {
  await d1.exec("PRAGMA foreign_keys = ON");
}

function notWired(): never {
  throw new Error(
    "[db] No D1 binding is wired yet. The module-level `db` is a placeholder until the " +
      "Cloudflare entrypoint lands: replace it with `createDb(env.DB)` (and call " +
      "`await initD1(env.DB)`) before any query runs.",
  );
}

const placeholderD1: D1DatabaseLike = {
  prepare: () => notWired(),
  batch: () => notWired(),
  exec: () => notWired(),
};

/**
 * Placeholder drizzle instance backed by a throwing D1 stub.
 *
 * TODO(cloudflare-entrypoint): replace with `createDb(env.DB)` — every
 * service/cron/seed imports this `db` name and it must keep being exported.
 */
export const db = createDb(placeholderD1);