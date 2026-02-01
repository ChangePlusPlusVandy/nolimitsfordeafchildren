# Story: Add Headshots and Directory View

## User Story
As a parent, I want to view administrators and teachers with headshots so that I can recognize the staff working with my child.

## Background
Stakeholders requested headshots for admins/teachers/parents/students and a directory for parents.

## Acceptance Criteria
- Users can upload headshots (admin, teacher, parent, student).
- Parent directory lists admins/teachers with headshots.
- Optional bios supported (if approved).

## Technical Notes
- Add avatar_url to user and student records.
- Add directory endpoint for parent view.

## Suggested Files
- apps/api/src/domains/users/models/entities/UserTable.ts
- apps/api/src/domains/students/models/entities/StudentTable.ts
- apps/api/src/domains/users/services/UsersService.ts
- apps/web/src/domains/users/pages/UserDetailsPage.tsx
- apps/web/src/domains/parents/pages/MyStudentsPage.tsx

## Dependencies
- File upload infrastructure.
