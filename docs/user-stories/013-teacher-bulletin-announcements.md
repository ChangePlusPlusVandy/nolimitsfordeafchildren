# Story: Teachers Can Create Announcements on Bulletin

## User Story
As a teacher, I want to post announcements to the bulletin so that parents at my location receive timely updates.

## Background
Stakeholders requested that teachers can create announcements; announcements at a location go to parents.

## Acceptance Criteria
- Teacher can create an announcement scoped to their location.
- Parents at that location can view the announcement.
- Admin can see all announcements.

## Technical Notes
- Bulletin permissions must allow teacher creation.
- Announcements should include location_id and created_by.

## Suggested Files
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/api/src/domains/bulletin/endpoints/BulletinsController.ts
- apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx

## Dependencies
- Auth + role permissions.
