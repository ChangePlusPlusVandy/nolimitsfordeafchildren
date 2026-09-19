# nolimits-app (v0.0.1)

Next.js 16 workspace. Run all commands from the repo root via
`pnpm --filter nolimits-app …` or from this dir directly.

Key gotchas:

- `wrangler.jsonc` paths (`main`, `migrations_dir`, `assets.directory`) are
  relative to this dir.
- `next.config.ts` calls `initOpenNextCloudflareForDev()` for local D1/R2.
- `worker.ts` is bundled by wrangler, excluded from `tsconfig.json`.
- `open-next.config.ts` sets `buildCommand: "next build"` to avoid recursing
  into `opennextjs-cloudflare build`.
- Version is managed by release-please (manifest tracks `app: 0.0.1`).
