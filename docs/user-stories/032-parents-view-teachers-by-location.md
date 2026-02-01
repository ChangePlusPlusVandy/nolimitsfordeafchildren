# Story: Parents View Teachers/Administrators by Location

## User Story
As a parent, I want to see the administrators and teachers at my location so that I know who to contact.

## Background
Stakeholders asked for parent access to staff lists with headshots.

## Acceptance Criteria
- Parent can view a staff list for their location.
- Each staff entry includes name, role, headshot, and contact info if allowed.

## Technical Notes
- Add endpoint to fetch staff by location.
- UI list in parent dashboard.

## Suggested Files
- apps/api/src/domains/locations/services/LocationsService.ts
- apps/api/src/domains/locations/endpoints/LocationsController.ts
- apps/web/src/domains/parents/pages/MyStudentsPage.tsx

## Dependencies
- Headshots story (025).
