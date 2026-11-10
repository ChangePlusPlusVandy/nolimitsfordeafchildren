/**
 * Augments the worker `CloudflareEnv` global with our app bindings.
 * The binding runtime types (`D1Database`, `R2Bucket`, `SendEmail`, ...)
 * come from the wrangler-generated `cloudflare-env.d.ts` at the app root
 * (`pnpm cf-typegen`).
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
