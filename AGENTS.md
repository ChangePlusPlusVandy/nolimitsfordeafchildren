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

This is a **Monorepo** managed by **TurboRepo** and **npm**.

### Structure
- **Root**: Configuration files (`package.json`, `turbo.json`, `biome.json`).
- **`apps/api`**: The backend REST API.
  - **Framework**: Express + `routing-controllers` + `typedi` (Dependency Injection).
  - **Database**: PostgreSQL with `drizzle-orm`.
  - **Language**: TypeScript (Node.js/Bun).
  - **Structure**: Domain-Driven Design (`src/domains/{domain_name}/...`).
- **`apps/web`**: The frontend web application.
  - **Framework**: React + Vite + React Router v7.
  - **UI Library**: Material UI (MUI) + Emotion.
  - **State**: React Query (`@tanstack/react-query`).
  - **Structure**: Domain-Driven Design (`src/domains/{domain_name}/...`).

## Domain Knowledge

**CRITICAL**: Before making functional changes, read **`docs/WEBPAGES.md`**. It contains the definitive business logic, user roles, and page requirements.

For the target data model, see **`docs/DATA_MODELS.md`**.

For implementation order and work breakdown, see **`docs/PLAN_OF_ATTACK.md`**.

### Key Concepts
- **Roles**: 
  - `Administrator`: Full access (Users, Locations, Schedules, Students, approve requests).
  - `Teacher`: Manage their daily sessions (`/my-day`), mark attendance, write notes, create assessments.
  - `Parent`: View their linked children's schedules and progress, request make-ups and schedule changes.
- **Locations**: A Student belongs to exactly **one** Location. Locations are either `education_center` or `pop_up`.
- **Schedules**: Created/edited **only** by Admins. Teachers have read-only access.
- **Attendance**: Teachers mark attendance (Present/No-Show/Cancelled) with reason dropdown for absences.
- **Assessments**: Pre/post assessments every 10-week cycle, scored 0-20.
- **Documents**: Audiograms (due every 6 months), IEPs, annual test results stored in S3.

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js / Bun |
| **Package Manager** | npm |
| **Monorepo** | TurboRepo |
| **Frontend** | React 19, Vite, MUI, React Query, React Router 7 |
| **Backend** | Express, routing-controllers, TypeDI |
| **Database** | PostgreSQL (any Postgres host) |
| **ORM** | Drizzle ORM |
| **Authentication** | Auth0 |
| **File Storage** | AWS S3 |
| **Maps** | react-leaflet + Leaflet (OpenStreetMap) |
| **Email** | Resend |
| **Scheduled Jobs** | node-cron |
| **Deployment** | Docker (platform-agnostic) |

> **Deployment Note:** The application is containerized with Docker for platform-agnostic deployment. Can be deployed to any platform supporting Docker containers (Railway, Render, AWS ECS, Google Cloud Run, etc.).

## Codebase Map

This project follows **Vertical Slice Architecture** with **Domain-Driven Design**. Each domain is a self-contained slice with its own endpoints, services, models, and (optionally) repositories.

### API Structure (`apps/api/src/`)

```
src/
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # Drizzle schema exports
├── s3/
│   └── index.ts              # AWS S3 client
├── domains/
│   ├── auth/
│   │   ├── endpoints/AuthController.ts
│   │   └── services/AuthService.ts
│   ├── attendance/
│   │   ├── endpoints/AttendanceController.ts
│   │   └── services/AttendanceService.ts
│   ├── bulletin/ & bulletins/
│   │   ├── models/entities/BulletinTable.ts
│   │   ├── endpoints/BulletinsController.ts
│   │   └── services/BulletinsService.ts
│   ├── enrollments/
│   │   ├── endpoints/EnrollmentsController.ts
│   │   └── services/EnrollmentsService.ts
│   ├── locations/
│   │   ├── models/entities/LocationTable.ts
│   │   ├── endpoints/LocationsController.ts
│   │   ├── endpoints/LocationsMapController.ts
│   │   └── services/LocationsService.ts
│   ├── me/
│   │   ├── endpoints/MeController.ts
│   │   └── services/MeService.ts
│   ├── parents/
│   │   ├── endpoints/ParentsController.ts
│   │   └── services/ParentsService.ts
│   ├── profiles/
│   │   ├── endpoints/ProfilesController.ts
│   │   └── services/ProfilesService.ts
│   ├── schedule/ & schedules/
│   │   ├── models/entities/ScheduleTable.ts
│   │   ├── endpoints/SchedulesController.ts
│   │   └── services/SchedulesService.ts
│   ├── sites/
│   │   └── endpoints/SitesController.ts
│   ├── students/
│   │   ├── endpoints/StudentsController.ts
│   │   ├── endpoints/StudentParentsAdminController.ts
│   │   └── services/StudentsService.ts
│   ├── teachers/
│   │   ├── endpoints/TeachersController.ts
│   │   ├── endpoints/TeacherMyDayController.ts
│   │   ├── endpoints/TeacherSchedulesController.ts
│   │   └── services/TeachersService.ts
│   └── users/
│       ├── models/entities/UserTable.ts
│       ├── endpoints/UsersController.ts
│       ├── endpoints/ShowUserEndpoint.ts
│       ├── services/UsersService.ts
│       ├── repositories/UserRepository.ts
│       └── projections/UserProjection.ts
├── server.ts                 # Express server setup
└── index.ts                  # Entry point
```

### Web Structure (`apps/web/src/`)

```
src/
├── assets/                   # Static assets (logo, images)
├── plugins/
│   └── axios.ts              # HTTP client with auth token injection
├── utils/
│   └── IHttpService.ts       # HTTP service interface
├── domains/
│   ├── global/
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx
│   │   │   └── Sidebar.tsx
│   │   └── layouts/
│   │       └── DashboardLayout.tsx
│   ├── bulletin/
│   │   ├── pages/BulletinBoardPage.tsx
│   │   └── services/BulletinHttpService.ts
│   ├── locations/
│   │   ├── pages/
│   │   │   ├── LocationsIndexPage.tsx
│   │   │   ├── LocationDetailsPage.tsx
│   │   │   ├── NewLocationPage.tsx
│   │   │   └── EditLocationPage.tsx
│   │   └── services/LocationHttpService.ts
│   ├── parents/
│   │   ├── pages/
│   │   │   ├── MyStudentsPage.tsx
│   │   │   └── ChildDetailsPage.tsx
│   │   └── services/ParentHttpService.ts
│   ├── students/
│   │   ├── pages/
│   │   │   ├── StudentDetailsPage.tsx
│   │   │   ├── NewStudentPage.tsx
│   │   │   ├── LinkTeacherModal.tsx
│   │   │   └── UploadDocumentModal.tsx
│   │   └── services/StudentHttpService.ts
│   ├── teachers/
│   │   ├── pages/
│   │   │   ├── MyDayPage.tsx
│   │   │   ├── TeacherDetailsPage.tsx
│   │   │   ├── NewTeacherPage.tsx
│   │   │   ├── TeacherScheduleWizardPage.tsx
│   │   │   └── TeacherStudentDetailsPage.tsx
│   │   └── services/TeacherHttpService.ts
│   └── users/
│       ├── pages/
│       │   ├── ManageUsersPage.tsx
│       │   ├── UserDetailsPage.tsx
│       │   ├── InviteUserModal.tsx
│       │   └── MyProfilePage.tsx
│       └── services/UserHttpService.ts
├── auth.tsx                  # Auth0 integration
├── config.ts                 # Environment config
└── main.tsx                  # App entry with routes
```

### Adding a New Domain (Vertical Slice)

**API Side:**
1. Create `src/domains/{domain}/endpoints/{Domain}Controller.ts`
2. Create `src/domains/{domain}/services/{Domain}Service.ts`
3. If needed: `src/domains/{domain}/models/entities/{Domain}Table.ts`
4. Register controller in `server.ts`

**Web Side:**
1. Create `src/domains/{domain}/pages/{Feature}Page.tsx`
2. Create `src/domains/{domain}/services/{Domain}HttpService.ts`
3. Add route in `main.tsx`

**Example - Adding "Assessments" domain:**
```
# API
apps/api/src/domains/assessments/
├── endpoints/AssessmentsController.ts
├── services/AssessmentsService.ts
└── models/entities/AssessmentTable.ts

# Web
apps/web/src/domains/assessments/
├── pages/AssessmentFormPage.tsx
├── pages/AssessmentHistoryPage.tsx
└── services/AssessmentHttpService.ts
```

## Development Workflow

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
This starts both the `api` (port 3000) and `web` (port 5173) in parallel.

### Database Operations (in `apps/api`)
- **Generate Migrations**: `npm run db:generate`
- **Run Migrations**: `npm run db:migrate`
- **Studio UI**: `npm run db:studio`

## Coding Conventions

1.  **Domain-Driven Design**:
    - Place feature-specific code in `src/domains/{domain}/`.
    - Common components go in `src/domains/global/`.
    - **Do NOT** create top-level `components/` or `utils/` folders unless absolutely necessary.
2.  **Naming**:
    - **Files**: `PascalCase.tsx` for components, `camelCase.ts` for logic.
    - **Classes**: `PascalCase` (e.g., `UsersController`).
    - **Variables**: `camelCase`.
3.  **Pathing**:
    - **ALWAYS** use absolute paths when reading/writing files (e.g., `/home/ryanmccauley/projects/nolimitsfordeafchildren/apps/api/src/...`).
4.  **Dependencies**:
    - Check `package.json` in the specific app (`apps/web` or `apps/api`) before importing new libraries.

## Interaction Guidelines

- **Safety First**: This system stores sensitive student data (PII). Ensure no secrets are logged or exposed.
- **Verification**: After making changes, try to verify them by checking for build errors (`tsc`, `npm run build` in the respective app).
- **Context**: If you are unsure about a business rule (e.g., "Can a teacher edit a schedule?"), refer to `docs/WEBPAGES.md`.
