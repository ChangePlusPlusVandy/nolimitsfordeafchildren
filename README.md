# No Limits for Deaf Children

Platform for managing education centers, students, teachers, parents, and schedules for a non-profit organization helping deaf children speak, learn, and dream.

## Stack

Single-package **Next.js 16 (App Router)** application deployed on **Cloudflare Workers** via **OpenNext**:

- **Frontend**: React 19, MUI 9, React Query
- **Backend**: Server Components, Server Actions, Route Handlers (no Express)
- **Auth**: better-auth (sqlite adapter)
- **Database**: Cloudflare D1 (SQLite) via drizzle-orm + drizzle-kit
- **Files**: Cloudflare R2 (served through authenticated `/api/files/*` routes)
- **Email**: Cloudflare Email Workers `send_email` binding
- **Cron**: Cloudflare Cron Triggers (`worker.ts` `scheduled` handler)
- **Package manager**: pnpm

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
cp .dev.vars.example .dev.vars
```

Fill in real values (admin bootstrap emails, auth URL, email from-address). Cloudflare bindings (D1/R2/Email) come from `wrangler.jsonc` automatically — do **not** list them in `.dev.vars`.

### 3. Apply Database Migrations (local D1)

```bash
pnpm db:generate                                          # generate migrations from src/db/schema.ts
pnpm exec wrangler d1 migrations apply nolimits-db --local
```

### 4. Start the Dev Server

```bash
pnpm dev
```

Runs `next dev` at **http://localhost:3000**. `next.config.ts` boots `initOpenNextCloudflareForDev()`, which wires the live local D1/R2 emulation into the dev server — no containers needed.

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run `next dev` with emulated Cloudflare bindings |
| `pnpm typecheck` / `pnpm exec tsc --noEmit` | Typecheck the whole project |
| `pnpm lint` | Biome check (`pnpm lint:fix` to autofix) |
| `pnpm build` | `opennextjs-cloudflare build` (produces `.open-next/` for wrangler) |
| `pnpm preview` | Build + `wrangler dev` preview with real emulated bindings |
| `pnpm deploy` | `wrangler deploy` — **manual per project**; requires `wrangler login` |
| `pnpm db:generate` | Generate D1 migrations (drizzle-kit, sqlite) |
| `pnpm cf-typegen` | Regenerate `cloudflare-env.d.ts` from `wrangler.jsonc` |

## Database (D1)

Migrations live in `migrations/` (created by the first `pnpm db:generate`; `drizzle.config.ts` and `wrangler.jsonc` `migrations_dir` both point there).

```bash
pnpm db:generate                                  # after editing src/db/schema.ts
pnpm exec wrangler d1 migrations apply nolimits-db --local   # local emulated D1
pnpm exec wrangler d1 migrations apply nolimits-db --remote  # production D1 (requires login)
```

> The `database_id` in `wrangler.jsonc` is a placeholder — run `wrangler d1 create nolimits-db` and paste the real ID before any remote work.

## Email

The `send_email` binding requires the **FROM address to be verified in the Cloudflare dashboard** (Workers & Pages → Email → Settings). Until then, `src/lib/email.ts` no-ops with a `console.warn`. Set `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` in `.dev.vars`.

## CI

`.github/workflows/ci.yml` runs install → typecheck → lint → build on every push/PR. Deployment is manual per project and is **not** part of CI.

## Project Structure

```
├── app/                  # Next.js App Router pages + API route handlers
├── src/
│   ├── client/           # Client components, hooks, and per-domain client data layers
│   ├── db/schema.ts      # Drizzle schema (sqlite/D1)
│   ├── lib/              # auth, db (D1 proxy), email, r2 helpers
│   ├── server/           # Domain slices: {domain}/{service,queries,actions}.ts + shared/ + cron/
│   └── utils/            # Shared utilities
├── middleware.ts         # Cookie-presence auth guard
├── worker.ts             # Wrangler entry: OpenNext handler + scheduled cron handler
├── wrangler.jsonc        # Bindings (DB/BUCKET/EMAIL) + cron triggers
├── drizzle.config.ts     # drizzle-kit config (sqlite)
├── next.config.ts        # Next config + initOpenNextCloudflareForDev()
└── open-next.config.ts   # OpenNext Cloudflare config
```

See `AGENTS.md` for detailed architecture documentation and coding conventions.