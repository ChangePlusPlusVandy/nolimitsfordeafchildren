# nolimits-app (v0.0.1)

Next.js 16 workspace on Vinext. Run all commands from the repo root via
`pnpm --filter nolimits-app …` or from this dir directly.

Key gotchas:

- `wrangler.jsonc` paths (`main`, `migrations_dir`) are relative to this
  dir. `main` is the custom Worker entry (`worker.ts`): Vinext fetch
  handler plus the `scheduled` cron handler, same Worker.
- `vite build` emits `dist/` (`dist/server/index.js` exports both `default`
  fetch and `scheduled`; `dist/server/wrangler.json` carries the bindings
  and cron triggers). Deploy with `vinext-cloudflare deploy --config
dist/server/wrangler.json` — never hand-edit `dist/`.
- `worker.ts` is bundled by the Cloudflare Vite plugin as the Worker entry.
- Bindings come from `cloudflare:workers` via `src/lib/env.ts`
  (`getBinding`/`getEnvValue`); never import `@opennextjs/cloudflare`.
- `next` stays as a dependency for authoritative `next/*` types; the
  runtime and build are Vinext (`vite dev` / `vite build`). `dev:next`
  runs plain Next.js without Cloudflare bindings.
- Version is managed by release-please (manifest tracks `app: 0.0.1`).
