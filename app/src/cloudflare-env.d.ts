/**
 * Augments the OpenNext `CloudflareEnv` global (declared by
 * `@opennextjs/cloudflare/dist/api/cloudflare-context.d.ts`) with our app
 * bindings. The binding runtime types (`D1Database`, `R2Bucket`, `SendEmail`,
 * `Fetcher`, ...) come from the wrangler-generated `cloudflare-env.d.ts` at
 * the repo root (`pnpm cf-typegen`).
 *
 * Keep this in sync with `wrangler.jsonc`.
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    BUCKET: R2Bucket;
    EMAIL: SendEmail;
  }
}

export {};
