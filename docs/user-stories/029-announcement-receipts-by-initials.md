# Story: Require Parent Initials for Specific Announcements

## User Story
As an administrator, I want parents to initial specific announcements so that we can confirm they reviewed critical updates.

## Background
Stakeholders requested parents must initial pre‑reports or other critical announcements.

## Acceptance Criteria
- Admin can mark an announcement as "requires initials".
- Parent must enter initials to acknowledge.
- Admin can export acknowledgement list.

## Technical Notes
- Add acknowledgement type with initials field.
- UI must block dismissal until initials are recorded.

## Suggested Files
- apps/api/src/domains/bulletin/models/entities/BulletinAcknowledgementTable.ts
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx

## Dependencies
- Announcement acknowledgements (story 015).
