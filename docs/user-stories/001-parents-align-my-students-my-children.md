# Story: Align "My Students" and "My Children" for Parents

## User Story
As a parent, I want the "My Students" and "My Children" pages to show the same content and layout so that I am not confused by two different views of my children.

## Background
Stakeholders noted that Parents see two different pages that should represent the same data. This creates confusion and inconsistent expectations.

## Acceptance Criteria
- Both entries show the same list, filters, and detail presentation.
- The same terminology is used across both pages.
- Parent-specific restrictions (PII visibility) are preserved.
- If one route is deprecated, it redirects to the other.

## Technical Notes
- Align data sources and UI components; consider consolidating into a single page component.
- Ensure AuthGuard and role checks remain intact.

## Suggested Files
- apps/web/src/domains/parents/pages/MyStudentsPage.tsx
- apps/web/src/domains/parents/pages/ChildDetailsPage.tsx
- apps/web/src/main.tsx

## Dependencies
- None.
