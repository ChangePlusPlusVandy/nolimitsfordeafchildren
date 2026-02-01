# Story: Add Flexible Schedule Change Workflow

## User Story
As a parent, I want to request schedule changes even if availability isn't listed so that administrators can coordinate exceptions with teachers.

## Background
Current workflow requires admin phone calls and manual coordination. Stakeholders want a way for parents to request flexibility, and admins to coordinate with teachers.

## Acceptance Criteria
- Parent can submit a request with preferred times, even if not listed.
- Admin can mark status (Pending, Negotiating, Approved, Denied).
- Teachers can indicate availability or accept exceptions.

## Technical Notes
- Add "requested times" and "flexibility notes" to request model.
- Add status transitions and audit log.

## Suggested Files
- apps/api/src/domains/schedules/models/entities/ScheduleChangeRequestTable.ts
- apps/api/src/domains/schedules/services/SchedulesService.ts
- apps/api/src/domains/schedules/endpoints/SchedulesController.ts
- apps/web/src/domains/parents/pages/BrowseSchedulesPage.tsx
- apps/web/src/domains/admin/pages/ScheduleChangeRequestsPage.tsx
- apps/web/src/domains/teachers/pages/TeacherScheduleWizardPage.tsx

## Dependencies
- Role permissions for admin/teacher actions.
