# e2e

Playwright scaffold for the No Limits monorepo. App under test is `../app`.

## Run

```bash
pnpm install                    # from repo root (installs browsers via postinstall)
pnpm test:e2e                   # from root, boots app dev server automatically
pnpm --filter nolimits-e2e test # same, from this dir
pnpm --filter nolimits-e2e test:ui
```

`playwright.config.ts` boots `pnpm --filter nolimits-app dev` via `webServer`
(baseURL `http://localhost:3000`, override with `PLAYWRIGHT_BASE_URL`).

## What's covered now

- `e2e/login.spec.ts` — real smoke: form renders, middleware redirects `/`
  → `/login`, bad-credentials error, signup-mode toggle.
- `e2e/api.spec.ts` — real `GET /api/health` check; rest skipped.
- Everything else is `test.skip` TODO stubs, one per route group:
  `auth-redirects`, `home-dashboard`, `locations`, `students`, `teachers`,
  `users`, `parents`, `admin`, `daily-work` (my-day / my-students /
  my-profile / bulletin / chat / pending-approval).

## Adding real coverage (next steps)

1. Add `fixtures/<role>.ts` that create `storageState` files per role
   (administrator / teacher / parent / unassigned) via `page.request`
   against better-auth + `app/db:seed`.
2. Unskip suites one file at a time; seed via `app/scripts/seed.ts` or
   D1 SQL fixtures (never production D1).
3. Keep PII assertions: lists show initials only; full PII only on detail
   pages for authorized roles.
4. Mobile-first: add a `Pixel 7` project for parent flows (most families
   are smartphone-only).
