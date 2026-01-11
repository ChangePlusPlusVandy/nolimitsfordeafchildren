# AGENTS.md

## Welcome, Agent

You are working on the **No Limits for Deaf Children** platform. This system manages education centers, students, teachers, parents, and schedules for a non-profit organization helping deaf children speak, learn, and dream.

Your goal is to help maintain, extend, and debug this application while strictly adhering to its architectural patterns and business rules.

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
  - **UI Library**: Material UI (MUI) + Emotion + Tailwind CSS.
  - **State**: React Query (`@tanstack/react-query`).
  - **Structure**: Domain-Driven Design (`src/domains/{domain_name}/...`).

## Domain Knowledge

**CRITICAL**: Before making functional changes, read **`docs/WEBPAGES.md`**. It contains the definitive business logic, user roles, and page requirements.

### Key Concepts
- **Roles**: 
  - `Administrator`: Full access (Users, Locations, Schedules, Students).
  - `Teacher`: Manage their daily sessions (`/my-day`) and view assigned students.
  - `Parent`: View their linked children's schedules and progress.
- **Locations**: A Student belongs to exactly **one** Location.
- **Schedules**: Managed by Admins. Teachers view them.
- **Attendance**: Teachers mark attendance (Present/No-Show/Cancelled).

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js / Bun |
| **Package Manager** | npm |
| **Monorepo** | TurboRepo |
| **Frontend** | React 19, Vite, MUI, React Query, React Router 7 |
| **Backend** | Express, routing-controllers, TypeDI |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Authentication** | Auth0 |
| **Cloud** | AWS S3 (for file uploads) |

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
