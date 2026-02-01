# Story: Track Sibling Participation in Classes/Events

## User Story
As an administrator, I want to record sibling participation in classes/events so that grant reporting includes all participants.

## Background
Stakeholders need to show sibling participation, not only hearing loss status.

## Acceptance Criteria
- Sibling participation can be linked to a class/event.
- Reports include sibling participation counts.

## Technical Notes
- Extend attendance/event schema to allow sibling participants.
- UI for adding sibling participants on event/session entry.

## Suggested Files
- apps/api/src/domains/attendance/models/entities/AttendanceTable.ts
- apps/api/src/domains/attendance/services/AttendanceService.ts
- apps/web/src/domains/teachers/pages/MyDayPage.tsx

## Dependencies
- Sibling participant model (story 002).
