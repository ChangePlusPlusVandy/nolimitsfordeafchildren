# Story: Add Announcement Approval and Targeting

## User Story
As an administrator, I want to approve certain announcements before they reach parents so that sensitive updates (e.g., graduation speeches) are reviewed.

## Background
Stakeholders want targeted announcements and admin approval, especially around graduation materials.

## Acceptance Criteria
- Teacher announcements can be marked "requires approval".
- Admin can approve/reject announcements.
- Parents only see approved announcements.

## Technical Notes
- Add approval status to bulletin model (draft/pending/approved/rejected).
- Add admin moderation UI.

## Suggested Files
- apps/api/src/domains/bulletin/models/entities/BulletinTable.ts
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/api/src/domains/bulletin/endpoints/BulletinsController.ts
- apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx
- apps/web/src/domains/admin/pages/BulletinModerationPage.tsx

## Dependencies
- Teacher announcement creation.
