# Story: Track Siblings Without Hearing Loss

## User Story
As a parent, I want to add siblings without hearing loss as participants so that they are included in program reporting and grant counts.

## Background
Stakeholders need to show that siblings participate in classes/events for grant and budgeting. This is not solely about hearing loss.

## Acceptance Criteria
- Parent can add a sibling participant without hearing loss.
- Sibling can be linked to a student and shown in sibling lists.
- Reporting can distinguish "participant" vs "hearing loss" students.

## Technical Notes
- Extend student or related entity to support a "participant" flag or type.
- Ensure PII rules: siblings listed by initials where required.

## Suggested Files
- apps/api/src/domains/students/models/entities/StudentTable.ts
- apps/api/src/domains/students/services/StudentsService.ts
- apps/api/src/domains/students/endpoints/StudentsController.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx
- apps/web/src/domains/parents/pages/ChildDetailsPage.tsx

## Dependencies
- None.
