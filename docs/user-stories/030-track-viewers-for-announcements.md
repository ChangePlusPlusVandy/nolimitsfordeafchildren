# Story: Track Announcement Views

## User Story
As an administrator, I want to see who viewed an announcement so that I can follow up with parents who have not read important updates.

## Background
Stakeholders requested view tracking in addition to acknowledgements.

## Acceptance Criteria
- System records when a parent opens an announcement.
- Admin can view per‑announcement view counts and list of viewers.
- Tracking respects privacy rules and role access.

## Technical Notes
- Add view tracking table (user_id, bulletin_id, viewed_at).
- Avoid duplicate records; store last_viewed_at.

## Suggested Files
- apps/api/src/domains/bulletin/models/entities/BulletinViewTable.ts
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx

## Dependencies
- Announcement acknowledgements (story 015).
