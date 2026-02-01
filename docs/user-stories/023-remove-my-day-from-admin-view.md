# Story: Remove My Day from Administrator View

## User Story
As an administrator, I should not see the "My Day" page so that the navigation reflects my actual responsibilities.

## Background
Stakeholders asked to remove My Day from administrator view.

## Acceptance Criteria
- Admins do not see My Day in navigation.
- Admins cannot access /my-day route.
- Teachers still have access.

## Technical Notes
- Update role guard logic and navigation config.

## Suggested Files
- apps/web/src/domains/global/components/Sidebar.tsx
- apps/web/src/domains/global/components/AuthGuard.tsx
- apps/web/src/main.tsx

## Dependencies
- Role checks already in auth.
