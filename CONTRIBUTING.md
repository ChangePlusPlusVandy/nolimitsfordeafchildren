# Contributing

Condensed from the former `AGENTS.md` (removed in the monorepo migration).
App code lives in `app/`; e2e in `tests/`.

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

Each domain is a self-contained slice with a service plus thin adapters:

```
app/src/server/{domain}/service.ts   # business logic + DTOs
app/src/server/{domain}/queries.ts   # "use server" reads for RSC
app/src/server/{domain}/actions.ts   # "use server" mutations (zod-validated)
app/src/client/{domain}.ts           # re-exports for client components/hooks
app/app/(dashboard)/{feature}/...    # RSC pages + client components
```

Shared: `app/src/client/components/`, `app/src/client/hooks/`,
`app/src/server/shared/auth-guard.ts` (`requireRole` / `getCurrentUser`),
`app/src/server/shared/errors.ts`, `app/src/server/cron/`.

Adding a domain: `service.ts` → `queries.ts` → `actions.ts` →
`src/client/{domain}.ts` → `app/(dashboard)/{feature}/` pages →
schema change (`app/src/db/schema.ts` + `pnpm db:generate`) if needed.

## Conventions

1. **Slices**: domain code in `app/src/server/{domain}/` + `app/src/client/{domain}.ts`.
   Shared components in `app/src/client/components/`; shared server helpers in
   `app/src/server/shared/`. Do NOT create top-level `components/` or `utils/`.
2. **RSC vs React Query**: RSC calls `queries.ts` for first paint; interactive
   mutations/polling use `useMutation`/`useQuery` over `app/src/client/{domain}.ts`.
   Mutations are `"use server"` functions in `actions.ts` — never raw DB writes.
3. **Authz**: gate every protected query/action with
   `requireRole("administrator", ...)` (or `getCurrentUser()` for explicit public
   exemptions). Role checks run server-side only.
4. **Validation**: zod schemas in `actions.ts` before any service call.
5. **Bindings**: `getCloudflareContext()` inside handlers/components only, never
   module top-level (`app/src/lib/db.ts`, `app/src/lib/auth.ts` use lazy access).
   Cron injects D1 via `setDb(env.DB)` (no request context).
6. **Naming**: `PascalCase.tsx` components, `camelCase.ts` logic, lowercase
   domain files (`service.ts`, `actions.ts`, `queries.ts`).
7. **Pathing**: `@/*` alias maps to `app/src/*`.
8. **Lint/format**: `oxlint` + `oxfmt` from repo root (`pnpm check`).
   Suppress with `eslint-disable-next-line <rule> -- <reason>`.

## Verification

```bash
pnpm typecheck
pnpm check
pnpm --filter nolimits-app build
pnpm test:e2e
```
