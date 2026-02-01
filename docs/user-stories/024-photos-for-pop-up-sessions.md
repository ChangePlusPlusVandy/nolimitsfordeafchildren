# Story: Add Photo Section for Pop-Up Sessions

## User Story
As a teacher, I want to upload photos from pop-up sessions so that parents and administrators can view them.

## Background
Stakeholders requested a photo section for pop-up sessions.

## Acceptance Criteria
- Teachers can upload photos linked to a session/location.
- Admins and parents can view photo galleries.
- Access controls prevent unauthorized viewing.

## Technical Notes
- Store photos in S3 with metadata (location_id, session_date).
- Provide gallery endpoints and pagination.

## Suggested Files
- apps/api/src/domains/photos/models/entities/PhotoTable.ts
- apps/api/src/domains/photos/services/PhotosService.ts
- apps/api/src/domains/photos/endpoints/PhotosController.ts
- apps/api/src/s3/index.ts
- apps/web/src/domains/teachers/pages/MyDayPage.tsx
- apps/web/src/domains/parents/pages/ChildDetailsPage.tsx

## Dependencies
- File upload infrastructure.
