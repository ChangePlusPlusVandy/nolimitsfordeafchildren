# AGENTS.md

## Welcome, Agent

You are working on the **No Limits for Deaf Children** platform. This system manages education centers, students, teachers, parents, and schedules for a non-profit organization helping deaf children speak, learn, and dream.

Your goal is to help maintain, extend, and debug this application while strictly adhering to its architectural patterns and business rules.

---

## Business Context

**No Limits for Deaf Children** is a non-profit organization that helps deaf children learn to speak through 62+ pop-up education sites across the country.

### Mission

Help deaf children speak, learn, and dream through consistent, high-quality speech education delivered at local libraries and community centers ("pop-ups") as well as dedicated education centers.

### Scale

- **62+ education sites** (pop-ups + education centers)
- **~72 teachers** working across sites
- **Teaching cycles**: 10 weeks per cycle, 3 sessions per week (M/W/S or T/Th/S)
- **Students**: Birth to age 21
- **Target cloud budget**: ~$100/month infrastructure

### Key Stakeholders

| Role | Primary Responsibilities |
|------|--------------------------|
| **Administrators** | Manage locations, users, schedules, student/teacher assignments, approve requests |
| **Teachers** | Conduct sessions, mark attendance, write session notes, track pre/post assessments |
| **Parents** | View child's schedule/progress, upload required documents, request make-ups and schedule changes |

### Critical Workflows

1. **10-Week Teaching Cycles**: Students meet the same teacher 3x/week for 10 weeks, then have a graduation
2. **Attendance Tracking**: Teachers mark present/no-show/cancelled with reasons; admins get alerts on misses
3. **Audiogram Compliance**: Parents must upload hearing tests every 6 months; system tracks due dates
4. **Pre/Post Assessments**: Teachers score students (0-20) at start and end of each 10-week cycle
5. **Graduation Speeches**: Every 10 weeks, students give graduation speeches (teachers have deadlines)
6. **Make-Up Classes**: Parents can request make-ups for missed sessions; admin approves, teacher hosts
7. **Schedule Changes**: Parents can browse available schedules and request changes (e.g., new job); admin approves

### Mobile-First Requirement

Many families rely solely on smartphones without home internet. The application must be responsive and efficient on mobile devices.

### Privacy & Compliance

- **PII Protection**: Lists show student initials only; full PII only on authorized detail pages
- **Sensitive Data**: Audiograms, IEPs, and assessment scores require proper access controls
- **Role-Based Access**: Parents see only their linked children; teachers see only assigned students

---

## Project Overview

This is a **single-package Next.js 16 (App Router) application** deployed on **Cloudflare Workers** via **OpenNext**. There is no monorepo, no separate API server, and no Docker — the backend and frontend live in the same package.

### Key facts

- **Next.js 16** (App Router, React 19, RSC) — server components, server actions, route handlers
- **MUI 9** + Emotion for the UI; **React Query** for interactive client data
- **better-auth** (sqlite adapter) for authentication, backed by the app `users` table
- **drizzle-orm** (sqlite dialect) against **Cloudflare D1** for storage; **R2** for document/file storage
- **Cloudflare bindings** come from `wrangler.jsonc` and are accessed via `getCloudflareContext()`: `DB` (D1), `BUCKET` (R2), `EMAIL` (send_email). No local Postgres/S3/MinIO — local dev emulates D1/R2 through wrangler (`next.config.ts` calls `initOpenNextCloudflareForDev()`).
- **Cron** via the `scheduled` handler in `worker.ts` + `triggers.crons` in `wrangler.jsonc`
- **Package manager**: pnpm (`pnpm-lock.yaml` is the lockfile of record)

---

## Domain Knowledge

### Key Concepts

- **Roles**:
  - `Administrator`: Full access (Users, Locations, Schedules, Students, approve requests).
  - `Teacher`: Manage their daily sessions (`/my-day`), mark attendance, write notes, create assessments.
  - `Parent`: View their linked children's schedules and progress, request make-ups and schedule changes.
  - `Unassigned`: Authenticated but pending administrator approval (role gate enforced by `requireRole`).
- **Locations**: A Student belongs to exactly **one** Location. Locations are `education_center`, `pop_up`, or `remote`.
- **Schedules**: Created/edited **only** by Admins. Teachers have read-only access.
- **Attendance**: Teachers mark attendance (Present/No-Show/Cancelled) with reason dropdown for absences.
- **Assessments**: Pre/post assessments every 10-week cycle, scored 0-20.
- **Documents**: Audiograms (due every 6 months), IEPs, annual test results stored in R2 (accessed through authenticated `/api/files/*` routes — no public URLs).

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Next.js 16 (App Router) on Cloudflare Workers via OpenNext (`nodejs_compat`) |
| **Package Manager** | pnpm |
| **Frontend** | React 19, MUI 9, React Query, Next App Router (RSC) |
| **Backend** | Server Components + Server Actions + Route Handlers (no Express) |
| **Database** | Cloudflare D1 (SQLite) via drizzle-orm (sqlite dialect) |
| **ORM** | Drizzle ORM (+ drizzle-kit for migrations) |
| **Authentication** | better-auth (sqlite adapter, bearer plugin) |
| **File Storage** | Cloudflare R2 (via authenticated `BUCKET` route handlers) |
| **Maps** | react-leaflet + Leaflet (OpenStreetMap) |
| **Email** | Cloudflare Email Workers `send_email` binding (`EMAIL`) |
| **Scheduled Jobs** | Cloudflare Cron Triggers (`worker.ts` `scheduled` handler) |
| **Validation** | zod (server action input schemas) |
| **Deployment** | `pnpm build` (opennextjs-cloudflare) + `wrangler deploy` |

> **Email note:** The `send_email` binding requires the FROM address to be **verified in the Cloudflare dashboard** (Workers & Pages → Email → Settings). Until then, `src/lib/email.ts` gracefully no-ops with a `console.warn`. Set `EMAIL_FROM_ADDRESS` in `.dev.vars` locally.
>
> **Deploy note:** `wrangler deploy` and `--remote` D1 commands require `wrangler login` — **not set up on all machines**. Deployment is manual per project (see the CI note below); CI does not deploy.

## Codebase Map

This project follows **Vertical Slice Architecture** with **Domain-Driven Design**, adapted to Next.js App Router. Each domain is a self-contained slice with a service (business logic) plus thin server-action/query adapters.

### Server structure (`src/server/{domain}/`)

```
src/
├── db/
│   └── schema.ts             # Drizzle schema (sqlite/D1), all tables + relations
├── lib/
│   ├── auth.ts               # better-auth instance (lazy getAuth() — never module top-level)
│   ├── db.ts                 # D1 → drizzle proxy (getDb/db; lazy getCloudflareContext())
│   ├── email.ts              # send_email binding wrappers (verified from-address required)
│   └── r2.ts                 # BUCKET helpers (uploads via /api/files/*, no public URLs)
├── server/
│   ├── {domain}/
│   │   ├── service.ts        # Domain business logic (service classes / pure functions)
│   │   ├── queries.ts        # Read adapters: "use server" exports for RSC/initial reads
│   │   ├── actions.ts        # Write adapters: "use server" Server Actions (mutations)
│   │   └── ...               # (cron jobs, jobs, etc. as needed)
│   ├── shared/
│   │   ├── auth-guard.ts     # requireRole / getCurrentUser / helpers
│   │   └── errors.ts         # HttpError / UnauthorizedError / NotFoundError / ForbiddenError
│   └── cron/
│       ├── index.ts          # runScheduledJobs() — dispatched from worker.ts
│       ├── birthdayJob.ts    # daily birthday notifications
│       └── audiogramJob.ts   # weekly audiogram due reminders
└── client/
    ├── {domain}.ts           # Client data-access layer: wraps server queries/actions
    ├── components/           # Shared client components (DataTable, modals, skeletons…)
    ├── hooks/                # Client hooks (e.g. useServerTable)
    ├── utils/                # Client utils
    └── auth.tsx              # Client auth provider (session + role-aware redirects)
```

### App structure (`app/`)

```
app/
├── layout.tsx                # Root layout (fonts, theme, providers)
├── providers.tsx             # MUI + React Query providers
├── theme.ts                  # MUI theme
├── login/page.tsx            # Public login
├── pending-approval/page.tsx # Unassigned-role landing
├── (dashboard)/
│   ├── layout.tsx            # Dashboard shell (sidebar, mobile nav)
│   ├── page.tsx              # Role-aware home
│   └── {feature}/…           # Feature pages (locations, students, teachers, my-day, …)
└── api/
    ├── auth/[...all]/route.ts        # better-auth handler
    ├── files/[key]/route.ts          # Authenticated R2 download
    ├── files/upload/route.ts         # Authenticated R2 upload
    └── health/route.ts
```

Root files: `middleware.ts` (cookie-presence auth guard, role checks stay server-side),
`worker.ts` (wrangler entry: re-exports OpenNext handler + `scheduled` cron handler),
`wrangler.jsonc` (bindings: DB/BUCKET/EMAIL + cron triggers), `drizzle.config.ts`,
`next.config.ts` (also boots `initOpenNextCloudflareForDev()`), `open-next.config.ts`.

### Adding a New Domain (Vertical Slice)

1. **Service**: Create `src/server/{domain}/service.ts` — business logic + DTO types (ported patterns from the legacy Express services).
2. **Queries**: Create `src/server/{domain}/queries.ts` with `"use server"`, one exported async function per read (e.g. `listX`, `showX`). Gate with `requireRole(...)` where not public.
3. **Actions**: Create `src/server/{domain}/actions.ts` with `"use server"`, one exported async function per mutation. Validate inputs with a zod schema, then `requireRole(...)` and call the service.
4. **Client layer**: Create `src/client/{domain}.ts` re-exporting the queries/actions (1:1 names) — client components and React Query hooks import from here, never from `src/server/` directly.
5. **Pages**: Add `app/(dashboard)/{feature}/...` App Router pages (RSC for initial reads; client components + React Query for interactive parts).
6. **Schema** (if new tables): add to `src/db/schema.ts`, then `pnpm db:generate` + apply migrations (see Development Workflow).
7. **Client hooks** (if needed): `src/client/hooks/` (e.g. a `useXTable` React Query hook).

**Example — adding an "Assessments" domain:**

```
src/server/assessments/
├── service.ts          # AssessmentsService: scoring, history queries, DTOs
├── queries.ts          # "use server" reads: listAssessments, showAssessment
└── actions.ts          # "use server" writes: createAssessment, updateAssessment
src/client/assessments.ts   # re-exports for client code
app/(dashboard)/assessments/ # RSC pages + client components
```

## Development Workflow

### Prerequisites

- Node.js 20+ and **pnpm** (see `packageManager` in `package.json`)
- **No Docker, no Postgres, no MinIO** — D1 and R2 are emulated locally by wrangler

### Local environment

Copy `.dev.vars.example` to `.dev.vars` and fill in real values. Bindings (DB/BUCKET/EMAIL) come from `wrangler.jsonc` automatically — do not list them in `.dev.vars`. Wrangler serves a live local D1 + R2 emulation; `initOpenNextCloudflareForDev()` (in `next.config.ts`) wires them into `next dev`.

### Running Locally

```bash
pnpm install
pnpm dev        # next dev on http://localhost:3000 (D1/R2 emulated via wrangler)
```

### Preview / Deploy (manual per project)

```bash
pnpm preview    # opennextjs-cloudflare preview (builds, then wrangler dev)
pnpm deploy     # wrangler deploy — requires `wrangler login` (NOT set up everywhere); we are NOT deploying
pnpm build      # opennextjs-cloudflare build (produces .open-next/ for wrangler)
```

### Database Operations (D1)

```bash
pnpm db:generate                                   # drizzle-kit generate → migrations/ (sqlite dialect)
pnpm exec wrangler d1 migrations apply nolimits-db --local   # apply to local emulated D1
pnpm exec wrangler d1 migrations apply nolimits-db --remote  # apply to production D1 (requires login)
```

> `drizzle.config.ts` uses `dialect: "sqlite"` and outputs to `./migrations`, matching `migrations_dir` in `wrangler.jsonc`. The `migrations/` directory is created by the first `db:generate`. The D1 `database_id` in `wrangler.jsonc` is a placeholder — replace it after `wrangler d1 create nolimits-db` before any remote work.

### Verification

```bash
pnpm exec tsc --noEmit   # typecheck (also `pnpm typecheck`)
pnpm lint                # biome check .
```

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → build on push/PR. There is no deploy step.

## Coding Conventions

1. **Vertical slices**:
   - Domain code goes in `src/server/{domain}/` (`service.ts`, `queries.ts`, `actions.ts`) and `src/client/{domain}.ts`.
   - Shared components go in `src/client/components/`; shared server helpers in `src/server/shared/`.
   - **Do NOT** create top-level `components/` or `utils/` folders.
2. **RSC vs. React Query**:
   - **RSC for initial reads**: server components call `queries.ts` directly for first paint.
   - **React Query for interactive mutations/polling**: client components that mutate or poll use `useMutation`/`useQuery` over the client layer (`src/client/{domain}.ts`), which calls the server actions/queries.
   - **Server Actions as mutation transport**: mutations are `"use server"` functions in `actions.ts`; never expose raw DB writes to the client.
3. **Authz**: gate every protected query/action with `requireRole("administrator", ...)` from `src/server/shared/auth-guard.ts` (or `getCurrentUser()` for the explicit public exemptions). Role checks run server-side only.
4. **Validation**: zod schemas in `actions.ts` validate inputs before any service call.
5. **Bindings**: access `getCloudflareContext()` **inside handlers/components, never at module top-level** (`src/lib/db.ts` and `src/lib/auth.ts` use lazy access/`Proxy` to enforce this). The `scheduled` cron handler injects the D1 binding via `setDb(env.DB)` because there is no request context.
6. **Naming**:
   - **Files**: `PascalCase.tsx` for components, `camelCase.ts` for logic; domain files are lowercase (`service.ts`, `actions.ts`, `queries.ts`).
   - **Classes**: `PascalCase` (e.g., `LocationsService`).
   - **Variables**: `camelCase`.
7. **Pathing**:
   - Use the `@/*` alias (`@/server/...`, `@/client/...`, `@/db/...`, `@/lib/...`) for imports.
   - **ALWAYS** use absolute paths when reading/writing files (e.g., `/home/ryan/dev/school/changeplusplus/nolimitsfordeafchildren/src/server/locations/service.ts`).
8. **Dependencies**: only add packages justified in this repo's environment (Next 16 + Cloudflare Workers). Check `package.json` before importing new libraries.

## Interaction Guidelines

- **Safety First**: This system stores sensitive student data (PII). Ensure no secrets are logged or exposed. R2 files are only served through authenticated `/api/files/*` routes — never hand out public R2 URLs.
- **Verification**: After making changes, verify by running `pnpm exec tsc --noEmit` and `pnpm lint` (and `pnpm build` for full OpenNext builds).
- **Context**: If you are unsure about a business rule (e.g., "Can a teacher edit a schedule?"), check the existing pages/services for the authoritative behavior — the old `docs/` folder has been removed.