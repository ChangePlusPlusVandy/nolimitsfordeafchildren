# Story: Support Unlimited Document Uploads Per Student

## User Story
As a teacher or administrator, I want to upload as many documents as needed so that all student records can be stored.

## Background
Stakeholders requested "as many documents as needed" without a cap.

## Acceptance Criteria
- No artificial limit on document count per student.
- Documents list paginates if large.
- Upload flow supports multiple files.

## Technical Notes
- Confirm API limits and S3 storage are not restrictive.
- Add pagination to document listing.

## Suggested Files
- apps/api/src/domains/students/services/StudentsService.ts
- apps/api/src/domains/students/endpoints/StudentsController.ts
- apps/web/src/domains/students/pages/UploadDocumentModal.tsx

## Dependencies
- S3 file upload.
