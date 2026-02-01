# Story: Add Week View Toggle to My Day

## User Story
As a teacher, I want a week-at-a-glance view so that I can quickly see upcoming sessions without clicking day by day.

## Background
Stakeholders want a toggle for "what's my week looking like" from the My Day page.

## Acceptance Criteria
- My Day includes a week view toggle.
- Week view shows daily counts and sessions by day.
- Default remains daily view.

## Technical Notes
- Add query support for week range in TeacherMyDayController.
- UI toggle in MyDayPage with calendar/week list layout.

## Suggested Files
- apps/api/src/domains/teachers/endpoints/TeacherMyDayController.ts
- apps/api/src/domains/teachers/services/TeachersService.ts
- apps/web/src/domains/teachers/pages/MyDayPage.tsx

## Dependencies
- None.
