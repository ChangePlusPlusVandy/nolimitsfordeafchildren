# Story: Add Remote Location Type

## User Story
As an administrator, I want to mark a location as remote so that scheduling and reporting correctly reflects remote sessions.

## Background
Stakeholders asked about a remote location type for teachers who work remotely.

## Acceptance Criteria
- Location type includes "remote".
- Remote locations display correctly in lists and scheduling.
- Reports include remote locations.

## Technical Notes
- Extend location type enum and validation.
- Update map/list UI to handle remote locations.

## Suggested Files
- apps/api/src/domains/locations/models/entities/LocationTable.ts
- apps/api/src/domains/locations/services/LocationsService.ts
- apps/api/src/domains/locations/endpoints/LocationsController.ts
- apps/web/src/domains/locations/pages/NewLocationPage.tsx
- apps/web/src/domains/locations/pages/EditLocationPage.tsx

## Dependencies
- None.
