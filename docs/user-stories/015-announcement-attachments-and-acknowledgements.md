# Story: Add Announcement Attachments and Parent Acknowledgements

## User Story
As a parent, I want to acknowledge important announcements and attachments so that the organization can confirm I have reviewed them.

## Background
Stakeholders want drag-and-drop attachments, tracking of who viewed announcements, and parent initials for certain announcements.

## Acceptance Criteria
- Announcements support file attachments (drag-and-drop upload).
- Parents can acknowledge announcements with initials.
- Admin can view acknowledgement status and view counts.

## Technical Notes
- Store attachments in S3 and link to bulletin record.
- Add acknowledgement table (user_id, bulletin_id, acknowledged_at).
- Add view tracking (optional analytics).

## Suggested Files
- apps/api/src/domains/bulletin/models/entities/BulletinTable.ts
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/api/src/domains/bulletin/endpoints/BulletinsController.ts
- apps/api/src/s3/index.ts
- apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx

## Dependencies
- Auth + file upload plumbing.
