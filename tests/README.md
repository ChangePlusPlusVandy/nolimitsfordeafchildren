# End-to-end tests

Playwright tests for `../app`: 8 active checks (login, API, admin navigation)
and 47 skipped route-group specs awaiting implementation. Chromium only.

## Prerequisites

Use the repository's Node.js and pnpm versions. From the repo root:

```bash
pnpm install
cp app/.dev.vars.example app/.dev.vars # only if not already configured
pnpm --filter nolimits-e2e exec playwright install chromium
pnpm --filter nolimits-app exec wrangler d1 migrations apply nolimits-d1-staging --local
pnpm --filter nolimits-app db:seed
```

Seed replaces local D1 data in `app/.wrangler/state` and adds fake R2 files.
Use a disposable checkout if local development data matters; never use remote
D1/R2 or production URLs. Reseed before runs, not while tests are running.

## Commands

```bash
pnpm test:e2e                              # boots the local app on port 3000
pnpm --filter nolimits-e2e test:ui
pnpm --filter nolimits-e2e test --list      # discovery only, no server needed
pnpm --filter nolimits-e2e typecheck
pnpm --filter nolimits-e2e lint
```

`playwright.config.ts` starts `pnpm --filter nolimits-app dev --port 3000`.
Default baseURL is `http://localhost:3000`; `PLAYWRIGHT_BASE_URL` changes the
test target only, not the server command. Keep it pointed at isolated local data.

## Implementing skipped specs

- Keep specs grouped by route; implement and unskip only the intended scenario.
- Import `signIn` or `signInAsAdmin` from `./fixtures`; call
  `await signIn(page, "teacher")` with a fresh Playwright page/context.
- `ROLE_CREDS` includes admin, teacher, parent, stranger (parent without linked
  children), and pending (unassigned). All use password `NoLimits!2026`.
- `fixtures.ts` includes optional setup/project snippets using `saveSession`
  and `sessionPath`. Role projects use `e2e/<role>/` and disjoint test matches;
  no setup projects run until configured. State files are gitignored under
  `playwright/.cache/auth`; regenerate after reseeding and never share them.
- Browser contexts isolate sessions, not D1/R2. Mutation tests need unique
  records and cleanup; use `--workers=1` when sharing seeded records.
- Assert student initials in lists, full PII only in authorized details, and
  parent/teacher access limited to linked/assigned students. Files stay behind
  authenticated `/api/files/*` routes.
- Add a `Pixel 7` project when implementing parent flows; keep mobile layouts
  usable for smartphone-only families.
