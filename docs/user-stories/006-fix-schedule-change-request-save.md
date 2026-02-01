# Story: Fix Schedule Change Request Save Bug

## User Story
As a parent, I want to submit schedule change requests without errors so that my request is reliably recorded.

## Background
Stakeholders reported a bug when saving schedule change requests.

## Acceptance Criteria
- Request submits successfully and persists.
- Parent receives confirmation after saving.
- Admin can view the request in the admin queue.

## Technical Notes
- Validate API payload shape and status codes.
- Add logging and error messaging to help trace failures.

## Suggested Files
- apps/api/src/domains/schedules/services/SchedulesService.ts
- apps/api/src/domains/schedules/endpoints/SchedulesController.ts
- apps/web/src/domains/parents/pages/BrowseSchedulesPage.tsx
- apps/web/src/domains/parents/pages/MyRequestsPage.tsx

## Dependencies
- None.
