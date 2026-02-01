# Story: Manage Sessions (Semesters) and Date Ranges

## User Story
As an administrator, I want to define named sessions with date ranges so that student schedules can be tracked per session.

## Background
Stakeholders refer to semesters as "sessions" and want to track schedules by Fall/Winter/Spring/Summer with date ranges.

## Acceptance Criteria
- Admin can create, edit, and archive sessions.
- Schedules can be associated with a session.
- Student schedule history shows session labels.

## Technical Notes
- Add Sessions domain (table, endpoints, services).
- Consider default current session selector in scheduling flows.

## Suggested Files
- apps/api/src/domains/sessions/models/entities/SessionTable.ts
- apps/api/src/domains/sessions/services/SessionsService.ts
- apps/api/src/domains/sessions/endpoints/SessionsController.ts
- apps/web/src/domains/admin/pages/SessionsPage.tsx
- apps/web/src/domains/schedules/pages/SchedulesPage.tsx

## Dependencies
- None.
