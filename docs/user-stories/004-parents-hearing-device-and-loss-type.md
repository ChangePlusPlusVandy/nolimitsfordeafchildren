# Story: Capture Hearing Device and Hearing Loss Type

## User Story
As a parent, I want to record my child's hearing device(s) and hearing loss type so that the program can track needs and outcomes.

## Background
Stakeholders requested device selection (BAHA, Hearing Aid, Cochlear Implant, Other), potentially multiple devices, and a hearing loss severity/type.

## Acceptance Criteria
- Parent can select one or more hearing devices.
- Parent can select hearing loss type/severity.
- Admins can view these attributes on student details.

## Technical Notes
- Add multi-select device field; store as array in DB.
- Add hearing loss type enum or lookup table.

## Suggested Files
- apps/api/src/domains/students/models/entities/StudentTable.ts
- apps/api/src/domains/students/services/StudentsService.ts
- apps/api/src/domains/students/endpoints/StudentsController.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx
- apps/web/src/domains/parents/pages/ChildDetailsPage.tsx

## Dependencies
- None.
