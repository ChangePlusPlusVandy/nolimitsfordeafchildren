# Story: Allow Teachers to Be Assigned to Multiple Locations

## User Story
As an administrator, I want to assign a teacher to multiple locations (including remote) so that scheduling reflects real assignments.

## Background
Stakeholders said teachers may work across locations, including remote locations.

## Acceptance Criteria
- Teachers can be assigned to multiple locations.
- Teacher profile shows all assigned locations.
- Schedules allow multi-location assignment.

## Technical Notes
- Add join table for teacher_locations.
- Update queries for teacher schedules and permissions.

## Suggested Files
- apps/api/src/domains/teachers/models/entities/TeacherLocationTable.ts
- apps/api/src/domains/teachers/services/TeachersService.ts
- apps/web/src/domains/teachers/pages/TeacherDetailsPage.tsx
- apps/web/src/domains/teachers/pages/TeacherScheduleWizardPage.tsx

## Dependencies
- Locations domain.
