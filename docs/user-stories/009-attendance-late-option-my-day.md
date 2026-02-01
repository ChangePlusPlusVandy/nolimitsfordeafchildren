# Story: Add Late Attendance Option on My Day

## User Story
As a teacher, I want to mark a student as late with a duration so that attendance reporting reflects partial attendance.

## Background
Stakeholders requested late options such as 10/15/30 minutes.

## Acceptance Criteria
- Attendance options include Late with selectable durations.
- Late status is stored and visible in attendance history.
- Admins can report on late counts.

## Technical Notes
- Extend attendance model to include status=late and late_minutes.
- Update attendance UI in MyDayPage and APIs.

## Suggested Files
- apps/api/src/domains/attendance/models/entities/AttendanceTable.ts
- apps/api/src/domains/attendance/services/AttendanceService.ts
- apps/api/src/domains/attendance/endpoints/AttendanceController.ts
- apps/web/src/domains/teachers/pages/MyDayPage.tsx

## Dependencies
- None.
