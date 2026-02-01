# Story: Allow Admins to Update Student Attendance

## User Story
As an administrator, I want to update attendance records so that missed sessions can be corrected without relying on teachers.

## Background
Stakeholders noted parents call the office to mark no-shows; admins need to update attendance.

## Acceptance Criteria
- Admin can update attendance for any student session.
- Changes are auditable (who changed, when, reason).
- UI shows updated attendance in student details.

## Technical Notes
- Add admin endpoints or extend existing attendance endpoints with role checks.
- Add audit log or metadata fields.

## Suggested Files
- apps/api/src/domains/attendance/services/AttendanceService.ts
- apps/api/src/domains/attendance/endpoints/AttendanceController.ts
- apps/web/src/domains/students/pages/StudentDetailsPage.tsx
- apps/web/src/domains/admin/pages/AttendanceOverridesPage.tsx

## Dependencies
- Role-based access control.
