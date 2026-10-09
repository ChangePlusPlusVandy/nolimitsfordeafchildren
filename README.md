# No Limits for Deaf Children

Platform for managing education centers, students, teachers, parents, and schedules for a non-profit organization helping deaf children speak, learn, and dream.

pnpm monorepo (`app/` + `tests/`). Versioning via release-please (see `release-please-config.json`); `app/` is currently `0.0.1`.

## Stack

**`app/`** — Next.js 16 (App Router) on Cloudflare Workers via Vinext:

- **Frontend**: React 19, MUI 9, React Query
- **Backend**: Server Components, Server Actions, Route Handlers (no Express)
- **Auth**: better-auth (sqlite adapter)
- **Database**: Cloudflare D1 (SQLite) via drizzle-orm + drizzle-kit
- **Files**: Cloudflare R2 (served through authenticated `/api/files/*` routes)
- **Email**: Cloudflare Email Workers `send_email` binding
- **Cron**: Cloudflare Cron Triggers (`worker.ts` `scheduled` handler)
- **Package manager**: pnpm

**`tests/`** — Playwright e2e scaffold (login smoke live, all other routes as `test.skip` TODO stubs).

## Prerequisites

- Node.js 20+
- pnpm (version pinned in `package.json` → `packageManager`)
- **No Docker, no Postgres, no MinIO** — D1 and R2 are emulated locally by wrangler

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

```bash
cp app/.dev.vars.example app/.dev.vars
```

Fill in real values (admin bootstrap emails, auth URL, email from-address). Cloudflare bindings (D1/R2/Email) come from `app/wrangler.jsonc` automatically — do **not** list them in `.dev.vars`.

### 3. Apply Database Migrations (local D1)

```bash
pnpm db:generate                                          # generate migrations from app/src/db/schema.ts
pnpm --filter nolimits-app exec wrangler d1 migrations apply nolimits-db --local
```

Run wrangler commands from `app/` (or via `--filter nolimits-app`); `migrations_dir` and `main` in `wrangler.jsonc` are relative to `app/`.

### 4. Start the Dev Server

```bash
pnpm dev
```

Runs `vite dev` at **http://localhost:3000**. The Cloudflare Vite plugin
wires the live local D1/R2 emulation into the dev server — no containers needed.

## Common Commands (repo root)

| Command                             | Description                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                          | Run `app` dev server with emulated Cloudflare bindings                             |
| `pnpm typecheck`                    | `tsc --noEmit` in every workspace with a typecheck script                          |
| `pnpm lint` / `pnpm lint:fix`       | `oxlint` / `oxlint --fix` per workspace                                            |
| `pnpm format:check` / `pnpm format` | `oxfmt --check .` / `oxfmt --write .` from root                                    |
| `pnpm check`                        | `oxlint && oxfmt --check .`                                                        |
| `pnpm build`                        | `vite build` for `app/` (produces `app/dist/`)                                     |
| `pnpm preview`                      | Serve the Vinext build with `wrangler dev` + emulated bindings                     |
| `pnpm deploy`                       | `vinext-cloudflare deploy` from `app/dist/` — **manual**; requires Cloudflare auth |
| `pnpm db:generate`                  | Generate D1 migrations (drizzle-kit, sqlite)                                       |
| `pnpm cf-typegen`                   | Regenerate `app/cloudflare-env.d.ts` from `app/wrangler.jsonc`                     |
| `pnpm test:e2e`                     | Playwright suite in `tests/` (boots app dev server automatically)                  |

## Database (D1)

Migrations live in `app/migrations/` (`app/drizzle.config.ts` and `app/wrangler.jsonc` `migrations_dir` both point there).

```bash
pnpm db:generate                                  # after editing app/src/db/schema.ts
pnpm --filter nolimits-app exec wrangler d1 migrations apply nolimits-db --local   # local emulated D1
pnpm --filter nolimits-app exec wrangler d1 migrations apply nolimits-db --remote  # production D1 (requires login)
```

## Email

The `send_email` binding requires the **FROM address to be verified in the Cloudflare dashboard** (Workers & Pages → Email → Settings). Until then, `app/src/lib/email.ts` fails loudly (never fakes success). Set `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` in `app/.dev.vars`.

## e2e

`tests/` holds the Playwright scaffold: `e2e/login.spec.ts` is live smoke, everything else is `test.skip` TODO stubs (one file per route group). See `tests/README.md`.

## CI

- `.github/workflows/ci.yml`: install → typecheck → lint → format-check → unit tests → Vinext build (+ bundle check + deploy dry-run) → Playwright smoke (chromium).
- `.github/workflows/deploy.yml`: build → D1 migrate → deploy (manual / push to `main`).
- `.github/workflows/release-please.yml`: opens version-bump PRs for `app/` (`app-vX.Y.Z` tags + GitHub releases). Deployment is manual and is **not** part of CI.

## Project Structure

```
├── app/                    # Next.js workspace (package: nolimits-app, v0.0.1)
│   ├── app/                # Next.js App Router pages + API route handlers
│   ├── src/
│   │   ├── client/         # Client components, hooks, per-domain client layers
│   │   ├── db/schema.ts    # Drizzle schema (sqlite/D1)
│   │   ├── lib/            # auth, db (D1 proxy), email, r2, env (worker bindings)
│   │   ├── server/         # Domain slices: {domain}/{service,queries,actions}.ts
│   │   └── utils/          # Shared utilities
│   ├── middleware.ts       # Cookie-presence auth guard
│   ├── worker.ts           # Custom Worker entry: Vinext fetch + scheduled cron
│   ├── wrangler.jsonc      # Bindings (DB/BUCKET/EMAIL) + cron triggers
│   ├── drizzle.config.ts   # drizzle-kit config (sqlite)
│   ├── next.config.ts      # Next config (no adapter glue)
│   └── vite.config.ts      # Vinext + Cloudflare Vite plugin
├── tests/                  # Playwright workspace (package: nolimits-e2e)
│   ├── e2e/                # login smoke + TODO stubs for all routes
│   └── playwright.config.ts
├── .oxlintrc.json / .oxfmtrc.jsonc  # shared lint/format
├── tsconfig.base.json      # shared strict base (workspaces extend it)
├── release-please-config.json + .release-please-manifest.json
└── CONTRIBUTING.md         # architecture + coding conventions
```

See `CONTRIBUTING.md` for vertical-slice conventions, authz rules, and business context.
