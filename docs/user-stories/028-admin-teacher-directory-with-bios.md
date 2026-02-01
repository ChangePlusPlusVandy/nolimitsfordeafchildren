# Story: Admin/Teacher Directory with Bios (Optional)

## User Story
As a parent, I want to view administrators and teachers with bios so that I can understand who supports my child.

## Background
Stakeholders mentioned headshots and bios; bios are optional depending on approval.

## Acceptance Criteria
- Directory shows name, role, headshot, and optional bio.
- Parents can access the directory from their dashboard.

## Technical Notes
- Extend user profile with bio field (optional).
- Ensure bio visibility respects privacy rules.

## Suggested Files
- apps/api/src/domains/users/models/entities/UserTable.ts
- apps/api/src/domains/users/services/UsersService.ts
- apps/web/src/domains/parents/pages/ParentDirectoryPage.tsx

## Dependencies
- Headshots story (025).
