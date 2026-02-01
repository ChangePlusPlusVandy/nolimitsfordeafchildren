# Story: Make Guardian Summary Read-Only for Parents

## User Story
As an administrator, I want the guardian summary to be read-only for parents so that only authorized staff can update sensitive notes.

## Background
Stakeholders noted parents should not be able to edit the guardian summary.

## Acceptance Criteria
- Parents cannot edit the guardian summary field.
- Admins/teachers retain edit access.
- UI clearly indicates read-only state for parents.

## Technical Notes
- Enforce permission server-side as well as in UI.

## Suggested Files
- apps/api/src/domains/students/services/StudentsService.ts
- apps/api/src/domains/students/endpoints/StudentsController.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx
- apps/web/src/domains/parents/pages/ChildDetailsPage.tsx

## Dependencies
- Role-based access control.
