# Contributing

Condensed from the former `AGENTS.md` (removed in the monorepo migration).
Runtime source lives in `app/app/`; workspace tooling in `app/`; e2e in `tests/`.

## Business context

Non-profit helping deaf children (birth–21) learn to speak through 62+ pop-up
sites + education centers. ~72 teachers, 10-week cycles at 3 sessions/week
(M/W/S or T/Th/S). Target cloud budget ~$100/mo. Many families are
smartphone-only — keep UI responsive and light.

Critical workflows: 10-week teaching cycles + graduation speeches; attendance
(present/no-show/cancelled with reasons); audiogram compliance (hearing test
every 6 months); pre/post assessments scored 0–20; make-up classes
(parent requests → admin approves → teacher hosts); schedule changes
(parent browses slots → admin approves).

Privacy: lists show student initials only; full PII only on authorized detail
pages. Audiograms, IEPs, assessment scores need access controls. Parents see
only linked children; teachers see only assigned students. R2 files only via
authenticated `/api/files/*` routes — never public URLs.

## Architecture (vertical slices + DDD in App Router)

Route groups own domain code without changing URLs. Keep use-case handlers,
validation, types, UI, and tests together; route adapters stay thin.

```
app/app/(dashboard)/({domain})/     # domain routes and private use cases
  _domain/client.ts                # browser-safe domain entry
  _domain/server.ts                # server-only domain entry
  _domain/queries.ts               # server reads for RSC
  _domain/types.ts                 # domain DTOs
  _domain/ui/                      # UI shared within this domain
app/app/(auth)/                    # authentication routes and session use cases
app/app/api/                       # HTTP adapters and API-private services
app/app/_platform/                 # auth, D1, schema, bindings, email, R2
app/app/_shared/                   # cross-domain UI, hooks, utils, server helpers
app/app/_jobs/cron/                # Worker scheduling, dispatch, and tests
```

Private folders (`_domain`, `_platform`, `_shared`, `_jobs`) are not routes.
Server-action adapters live with their use cases; domain entry modules expose
only the operations needed by routes or other domains. Browser imports must
retain the `"use server"` boundary, not pull server implementation into bundles.
Birthday and audiogram jobs belong to students and documents respectively;
scheduling imports their narrow `_domain/jobs` entries, never action barrels.

Add a domain under `app/app/(dashboard)/({domain})/`, keeping its routes and
private implementation together. Change `app/app/_platform/db/schema.ts` and
run `pnpm db:generate` only when the database schema changes.

## Conventions

1. **Slices**: domain code stays under its route group, not global client/server
   trees. Use `app/app/_shared/ui/` and `app/app/_shared/server/` only for genuinely
   cross-domain code; domain-specific components stay with their domain.
2. **RSC vs React Query**: RSC calls `queries.ts` for first paint; interactive
   mutations/polling use `useMutation`/`useQuery` over `_domain/client.ts`.
   Mutations use `"use server"` adapters, never raw DB writes from UI.
3. **Authz**: gate every protected query/action with
   `requireRole("administrator", ...)` (or `getCurrentUser()` for explicit public
   exemptions). Role checks run server-side only.
4. **Validation**: keep zod schemas with each use case; validate before service calls.
5. **Bindings**: `getBinding()` / `getEnvValue()` from `app/app/_platform/env.ts`
   inside handlers/components only, never
   module top-level (`@/_platform/db` and `@/_platform/auth/server` use lazy access).
   Cron injects D1 via `setDb(env.DB)` (no request context).
6. **Naming**: `PascalCase.tsx` components, `camelCase.ts` logic, lowercase
   domain files (`service.ts`, `actions.ts`, `queries.ts`).
7. **Pathing**: `@/*` maps to `app/app/*`. Config, public assets, migrations, scripts,
   and thin framework entry points remain at workspace level; do not recreate `app/src/`.
8. **Lint/format**: `oxlint` + `oxfmt` from repo root (`pnpm check`).
   Suppress with `eslint-disable-next-line <rule> -- <reason>`.

## Verification

Unit discovery includes every `app/app/**/*.test.ts`, including private folders
and route groups. Node 22 runs explicit paths through `tsx`, not shell globs.
Scheduled tests need migrated local D1. Run stateful checks in a disposable
checkout if existing `.wrangler` data matters; seed replaces local data.

```bash
pnpm typecheck
pnpm check
pnpm --filter nolimits-app test:unit
pnpm --filter nolimits-app build
pnpm test:e2e
```
