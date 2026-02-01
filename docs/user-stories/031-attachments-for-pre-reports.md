# Story: Attach Pre‑Reports and Graduation Speeches

## User Story
As a teacher, I want to upload pre‑reports and graduation speech documents so that administrators can approve them before parents see them.

## Background
Stakeholders requested teacher upload of documents and admin approval for graduation speeches.

## Acceptance Criteria
- Teacher can upload documents tied to a student and session.
- Admin can approve/reject before parent access.
- Parent can view approved documents and acknowledge when required.

## Technical Notes
- Extend document upload flow with status fields.
- Add admin review UI for documents.

## Suggested Files
- apps/api/src/domains/students/services/StudentsService.ts
- apps/api/src/domains/students/endpoints/StudentsController.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx
- apps/web/src/domains/admin/pages/DocumentReviewPage.tsx

## Dependencies
- Announcement acknowledgements (story 015) if tying to initials.
