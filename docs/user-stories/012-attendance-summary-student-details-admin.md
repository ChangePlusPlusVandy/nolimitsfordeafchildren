# Story: Show Attendance on Student Details for Admins

## User Story
As an administrator, I want to see attendance summary on the student details page so that I can understand engagement at a glance.

## Background
Stakeholders requested attendance on student details for administrators.

## Acceptance Criteria
- Admins see attendance summary (present/no-show/cancelled/late counts).
- Recent attendance entries are listed.
- Parents/teachers see only what they are authorized to view.

## Technical Notes
- Add attendance summary API in StudentsService or AttendanceService.
- Add section on StudentDetailsPage.

## Suggested Files
- apps/api/src/domains/attendance/services/AttendanceService.ts
- apps/api/src/domains/students/services/StudentsService.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx

## Dependencies
- Attendance data must be available.
