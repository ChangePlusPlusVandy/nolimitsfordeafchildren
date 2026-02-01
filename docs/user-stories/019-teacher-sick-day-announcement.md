# Story: Teacher Sick-Day Notification and Announcement

## User Story
As a teacher, I want to mark myself as sick so that parents are notified and administrators can adjust schedules.

## Background
Stakeholders asked for a way to notify parents when a teacher is sick; announcements should be location-specific.

## Acceptance Criteria
- Teacher can mark a session/day as sick.
- Parents at the location receive an announcement.
- Admins can see all sick-day notices.

## Technical Notes
- Create announcement tied to teacher location and date.
- Optional email integration (Resend).

## Suggested Files
- apps/api/src/domains/teachers/services/TeachersService.ts
- apps/api/src/domains/bulletin/services/BulletinsService.ts
- apps/api/src/domains/bulletin/endpoints/BulletinsController.ts
- apps/web/src/domains/teachers/pages/MyDayPage.tsx

## Dependencies
- Teacher announcements (story 013).
