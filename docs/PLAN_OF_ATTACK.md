# Plan of Attack

This document outlines the implementation phases and work chunks for the No Limits for Deaf Children platform. Each chunk is designed as a **full-stack unit of work** that can be assigned to an AI agent or developer.

---

## Overview

| Phase | Description | Chunks |
|-------|-------------|--------|
| 1 | Data Model Foundation | 1.1, 1.2 |
| 2 | Authentication & Users | 2.1, 2.2 |
| 3 | Locations | 3.1 |
| 4 | Teachers & Schedules | 4.1, 4.2 |
| 5 | Students | 5.1, 5.2 |
| 6 | Attendance | 6.1 |
| 7 | Document Management | 7.1 |
| 8 | Bulletin Board | 8.1 |
| 9 | Parent Portal | 9.1 |
| 10 | Session Notes | 10.1 |
| 11 | Assessments | 11.1 |
| 12 | Profile & Settings | 12.1 |
| 13 | Make-Up Classes | 13.1 |
| 14 | Schedule Change Requests | 14.1 |
| 15 | Notifications & Polish | 15.1, 15.2 |

**Total: 15 phases, 18 work chunks**

---

## Phase 1: Data Model Foundation

### Chunk 1.1: Core Schema Fixes & Enums

**Goal:** Fix existing bugs and add all enum types.

**Tasks:**

1. Fix `BulletinTable` - change table name from `"locations"` to `"bulletins"`
2. Fix `TeacherProfileTable.primary_site_id` - should reference `LocationTable.id`
3. Fix column typos: `guardian_sumarry` → `guardian_summary`, `updtated_at` → `updated_at`
4. Add `email` field back to `UserTable` (currently commented out)
5. Create enums in Drizzle:
   - `user_role`: `administrator`, `teacher`, `parent`
   - `location_type`: `education_center`, `pop_up`
   - `attendance_status`: `present`, `no_show`, `cancelled`
   - `absence_reason`: `sick`, `family_emergency`, `transportation`, `schedule_conflict`, `no_show_unknown`, `other`
   - `document_type`: `audiogram`, `iep`, `cv`, `annual_test_result`, `other`
   - `assessment_type`: `pre`, `post`
   - `age_group_specialty`: `infant`, `toddler`, `preschool`, `elementary`, `middle_school`, `high_school`, `young_adult`, `all_ages`
   - `request_status`: `pending`, `approved`, `denied`, `completed`
   - `bulletin_scope`: `global`, `site`
   - `bulletin_role_target`: `all`, `administrator`, `teacher`, `parent`
6. Add `role` field to `UserTable`
7. Add `type` and `zoom_link` fields to `LocationTable`
8. Add `status` field to `AttendanceTable`
9. Update `db/schema.ts` to export all tables
10. Generate and run migrations

**Files to modify:**
- `apps/api/src/domains/users/models/entities/UserTable.ts`
- `apps/api/src/domains/locations/models/entities/LocationTable.ts`
- `apps/api/src/domains/bulletin/models/entities/BulletinTable.ts`
- `apps/api/src/db/schema.ts`

---

### Chunk 1.2: New Tables

**Goal:** Create all missing tables.

**Tasks:**

1. Create `SiblingTable` in `apps/api/src/domains/students/models/entities/`
   - Fields: id, student_id, name, age, relationship, photo_url, notes, timestamps

2. Create `DocumentTable` in `apps/api/src/domains/documents/models/entities/`
   - Fields: id, entity_type, entity_id, document_type, file_url, file_name, file_size, mime_type, document_date, next_due_date, uploaded_by, timestamps

3. Create `SessionNoteTable` in `apps/api/src/domains/notes/models/entities/`
   - Fields: id, student_id, teacher_id, schedule_id, session_date, note, timestamps

4. Create `AssessmentTable` in `apps/api/src/domains/assessments/models/entities/`
   - Fields: id, student_id, teacher_id, cycle_start_date, assessment_type, teaching_focus, score, notes, assessed_at, timestamps

5. Create `BulletinAttachmentTable` in `apps/api/src/domains/bulletins/models/entities/`
   - Fields: id, bulletin_id, file_url, file_name, file_size, mime_type, created_at

6. Create `MakeupRequestTable` in `apps/api/src/domains/makeups/models/entities/`
   - Fields: id, student_id, original_session_date, original_schedule_id, reason, reason_text, preferred_dates, status, requested_by, requested_at, reviewed_by, reviewed_at, review_notes, timestamps

7. Create `MakeupSessionTable` in `apps/api/src/domains/makeups/models/entities/`
   - Fields: id, makeup_request_id, student_id, teacher_id, site_id, scheduled_date, scheduled_time, attendance_status, notes, created_by, timestamps

8. Create `ScheduleChangeRequestTable` in `apps/api/src/domains/schedule-changes/models/entities/`
   - Fields: id, student_id, current_schedule_id, requested_schedule_id, reason, status, requested_by, requested_at, reviewed_by, reviewed_at, review_notes, timestamps

9. Add `current_school` field to `StudentTable`
10. Add `age_group_specialty` field to `TeacherProfileTable`
11. Add Drizzle `relations()` for all tables
12. Update `db/schema.ts` to export new tables
13. Generate and run migrations

**New domains to create:**
- `apps/api/src/domains/documents/`
- `apps/api/src/domains/notes/`
- `apps/api/src/domains/assessments/`
- `apps/api/src/domains/makeups/`
- `apps/api/src/domains/schedule-changes/`

---

## Phase 2: Authentication & Users

### Chunk 2.1: Auth System

**Goal:** Working authentication with Auth0 and role-based middleware.

**API Tasks:**
1. Verify Auth0 integration in `apps/api/src/domains/auth/`
2. Create auth middleware that extracts user from JWT
3. Create role-based authorization middleware (`requireRole('administrator')`)
4. Implement endpoints:
   - `POST /v1/auth/callback` - Auth0 callback handler
   - `GET /v1/auth/me` - Get current user from token
   - `POST /v1/auth/logout` - Logout handler

**Web Tasks:**
1. Verify Auth0 integration in `apps/web/src/auth.tsx`
2. Implement `/login` page with Auth0 redirect
3. Verify `AuthGuard` component works correctly
4. Add logout button functionality in Sidebar
5. Store user info in React context

**Files:**
- `apps/api/src/domains/auth/endpoints/AuthController.ts`
- `apps/api/src/domains/auth/services/AuthService.ts`
- `apps/api/src/domains/auth/middleware/authMiddleware.ts` (new)
- `apps/api/src/domains/auth/middleware/roleMiddleware.ts` (new)
- `apps/web/src/auth.tsx`
- `apps/web/src/domains/global/components/AuthGuard.tsx`

---

### Chunk 2.2: User Management (Admin)

**Goal:** Admins can view, invite, and manage users.

**API Tasks:**
1. Implement `UsersService` methods:
   - `index(filters)` - List users with pagination, role filter
   - `show(id)` - Get user details
   - `invite(email, role, siteIds)` - Send invite email, create pending user
   - `update(id, data)` - Update user profile
   - `disable(id)` - Soft disable user

2. Update `UsersController` endpoints:
   - `GET /v1/users` - List users (admin only)
   - `GET /v1/users/:id` - Get user details (admin only)
   - `POST /v1/users/invite` - Invite new user (admin only)
   - `PATCH /v1/users/:id` - Update user (admin only)
   - `DELETE /v1/users/:id` - Disable user (admin only)

**Web Tasks:**
1. Implement `ManageUsersPage`:
   - User list table with columns: name, email, role, status, actions
   - Role filter dropdown
   - Search by name/email
   - Pagination

2. Implement `UserDetailsPage`:
   - Display user info
   - Edit form (name, email, phone, role)
   - Enable/disable toggle
   - Site assignments (for teachers)

3. Implement `InviteUserModal`:
   - Email field
   - Role dropdown
   - Site assignment (if teacher)
   - Send invite button

**Files:**
- `apps/api/src/domains/users/services/UsersService.ts`
- `apps/api/src/domains/users/endpoints/UsersController.ts`
- `apps/web/src/domains/users/pages/ManageUsersPage.tsx`
- `apps/web/src/domains/users/pages/UserDetailsPage.tsx`
- `apps/web/src/domains/users/pages/InviteUserModal.tsx`
- `apps/web/src/domains/users/services/UserHttpService.ts`

---

## Phase 3: Locations

### Chunk 3.1: Locations CRUD + Map

**Goal:** Location management with interactive map.

**API Tasks:**
1. Implement `LocationsService` methods:
   - `index()` - List all locations with active session status
   - `show(id)` - Location details with current sessions, teachers, students
   - `create(data)` - Create new location
   - `update(id, data)` - Update location
   - `getActiveSessionStatus(id)` - Check if location has active sessions

2. Update `LocationsController` endpoints:
   - `GET /v1/locations` - List locations with geo data
   - `GET /v1/locations/:id` - Location details
   - `POST /v1/locations` - Create location (admin)
   - `PATCH /v1/locations/:id` - Update location (admin)

3. Implement `LocationsMapController`:
   - `GET /v1/locations/map` - Optimized endpoint for map pins (id, name, lat, lng, isActive)

**Web Tasks:**
1. Install react-leaflet: `npm install react-leaflet leaflet @types/leaflet`

2. Implement `LocationsIndexPage`:
   - Map component with pins (green=active, red=inactive)
   - List view toggle
   - Click pin → location details
   - "Add Location" button

3. Implement `LocationDetailsPage`:
   - Location info (name, type, address, zoom link)
   - "Who's here now" section
   - Teacher roster
   - Student roster (initials only)
   - Edit button

4. Implement `NewLocationPage`:
   - Form: name, type dropdown, address fields
   - Geo picker (click map or enter lat/lng)
   - Timezone dropdown
   - Zoom link field

5. Implement `EditLocationPage`:
   - Same form as create, pre-populated

**Files:**
- `apps/api/src/domains/locations/services/LocationsService.ts`
- `apps/api/src/domains/locations/endpoints/LocationsController.ts`
- `apps/api/src/domains/locations/endpoints/LocationsMapController.ts`
- `apps/web/src/domains/locations/pages/LocationsIndexPage.tsx`
- `apps/web/src/domains/locations/pages/LocationDetailsPage.tsx`
- `apps/web/src/domains/locations/pages/NewLocationPage.tsx`
- `apps/web/src/domains/locations/pages/EditLocationPage.tsx`
- `apps/web/src/domains/locations/components/LocationMap.tsx` (new)
- `apps/web/src/domains/locations/services/LocationHttpService.ts`

---

## Phase 4: Teachers & Schedules

### Chunk 4.1: Teacher Profiles

**Goal:** Teacher profile management.

**API Tasks:**
1. Implement `TeachersService` methods:
   - `index(filters)` - List teachers with specialty filter
   - `show(id)` - Teacher details with students and schedules
   - `create(data)` - Create teacher profile
   - `update(id, data)` - Update teacher profile

2. Update `TeachersController`:
   - `GET /v1/teachers` - List teachers (admin)
   - `GET /v1/teachers/:id` - Teacher details
   - `POST /v1/teachers` - Create teacher (admin)
   - `PATCH /v1/teachers/:id` - Update teacher

**Web Tasks:**
1. Implement `TeacherDetailsPage`:
   - Profile section: photo, bio, qualifications, specialty badge
   - CV document link (if uploaded)
   - Assigned students list
   - Schedules list
   - Edit button, "Add Schedule" button

2. Implement `NewTeacherPage`:
   - Form: name, email, phone
   - Primary site dropdown
   - Age group specialty dropdown
   - Bio, qualifications (optional)

**Files:**
- `apps/api/src/domains/teachers/services/TeachersService.ts`
- `apps/api/src/domains/teachers/endpoints/TeachersController.ts`
- `apps/web/src/domains/teachers/pages/TeacherDetailsPage.tsx`
- `apps/web/src/domains/teachers/pages/NewTeacherPage.tsx`
- `apps/web/src/domains/teachers/services/TeacherHttpService.ts`

---

### Chunk 4.2: Schedule Management (Admin)

**Goal:** Admin can create and manage teacher schedules.

**API Tasks:**
1. Implement `SchedulesService` methods:
   - `index(filters)` - List schedules by teacher/site
   - `show(id)` - Schedule details with enrolled students
   - `create(teacherId, data)` - Create schedule
   - `update(id, data)` - Update schedule
   - `checkConflicts(teacherId, data)` - Check for time conflicts
   - `getAvailable(filters)` - Get available schedules for parents to browse

2. Update `SchedulesController`:
   - `GET /v1/schedules` - List schedules
   - `GET /v1/schedules/available` - Available schedules (for parent browse)
   - `GET /v1/schedules/:id` - Schedule details
   - `POST /v1/teachers/:id/schedules` - Create schedule for teacher (admin)
   - `PATCH /v1/schedules/:id` - Update schedule (admin)
   - `POST /v1/schedules/check-conflicts` - Conflict check

**Web Tasks:**
1. Implement `TeacherScheduleWizardPage`:
   - Step 1: Select pattern (M/W/S or T/Th/S)
   - Step 2: Set times (start/end)
   - Step 3: Set cycle dates
   - Step 4: Optional Saturday
   - Step 5: Conflict check display
   - Step 6: Review & create

2. Add schedule list component for teacher details page

**Files:**
- `apps/api/src/domains/schedules/services/SchedulesService.ts`
- `apps/api/src/domains/schedules/endpoints/SchedulesController.ts`
- `apps/api/src/domains/teachers/endpoints/TeacherSchedulesController.ts`
- `apps/web/src/domains/teachers/pages/TeacherScheduleWizardPage.tsx`
- `apps/web/src/domains/teachers/components/ScheduleList.tsx` (new)

---

## Phase 5: Students

### Chunk 5.1: Student CRUD + Siblings

**Goal:** Student management with sibling support.

**API Tasks:**
1. Implement `StudentsService` methods:
   - `index(filters, userRole, userId)` - List students (scoped by role)
   - `show(id)` - Student details with siblings, teachers, parents
   - `create(data)` - Create student
   - `update(id, data)` - Update student
   - `addSibling(studentId, data)` - Add sibling
   - `updateSibling(siblingId, data)` - Update sibling
   - `removeSibling(siblingId)` - Remove sibling

2. Update `StudentsController`:
   - `GET /v1/students` - List students
   - `GET /v1/students/:id` - Student details
   - `POST /v1/students` - Create student (admin)
   - `PATCH /v1/students/:id` - Update student (admin)
   - `POST /v1/students/:id/siblings` - Add sibling
   - `PATCH /v1/siblings/:id` - Update sibling
   - `DELETE /v1/siblings/:id` - Remove sibling

**Web Tasks:**
1. Implement `StudentDetailsPage`:
   - Profile: name, initials, DOB, location, school
   - Siblings: Avatar row with hover cards
   - Linked teachers list
   - Linked parents list
   - Attendance summary
   - Documents section
   - Assessments section
   - Session notes

2. Implement `NewStudentPage`:
   - Form: name, initials, DOB
   - Location dropdown (required)
   - Current school field
   - Language, guardian summary

3. Implement sibling modal (add/edit)

**Files:**
- `apps/api/src/domains/students/services/StudentsService.ts`
- `apps/api/src/domains/students/endpoints/StudentsController.ts`
- `apps/web/src/domains/students/pages/StudentDetailsPage.tsx`
- `apps/web/src/domains/students/pages/NewStudentPage.tsx`
- `apps/web/src/domains/students/components/SiblingAvatars.tsx` (new)
- `apps/web/src/domains/students/components/AddSiblingModal.tsx` (new)

---

### Chunk 5.2: Student Linking (Teachers + Parents)

**Goal:** Admin can link teachers and parents to students.

**API Tasks:**
1. Add to `StudentsService`:
   - `linkTeacher(studentId, teacherId)` - Link teacher
   - `unlinkTeacher(studentId, teacherId)` - Unlink teacher
   - `linkParent(studentId, parentId, relationship)` - Link parent
   - `unlinkParent(studentId, parentId)` - Unlink parent

2. Update `StudentParentsAdminController`:
   - `POST /v1/students/:id/teachers` - Link teacher
   - `DELETE /v1/students/:id/teachers/:teacherId` - Unlink teacher
   - `POST /v1/students/:id/parents` - Link parent
   - `DELETE /v1/students/:id/parents/:parentId` - Unlink parent

**Web Tasks:**
1. Implement `LinkTeacherModal`:
   - Search/select teachers
   - Display currently linked
   - Add/remove buttons

2. Implement `LinkParentModal`:
   - Search/select parents
   - Relationship dropdown
   - Display currently linked
   - Add/remove buttons

**Files:**
- `apps/api/src/domains/students/endpoints/StudentParentsAdminController.ts`
- `apps/web/src/domains/students/pages/LinkTeacherModal.tsx`
- `apps/web/src/domains/students/pages/LinkParentModal.tsx` (new)

---

## Phase 6: Attendance

### Chunk 6.1: Attendance System

**Goal:** Teachers can mark attendance with reasons.

**API Tasks:**
1. Implement `AttendanceService` methods:
   - `getForSchedule(scheduleId, date)` - Get attendance for a day
   - `getForStudent(studentId)` - Get student's attendance history
   - `mark(studentId, scheduleId, date, status, reason, reasonText)` - Mark attendance
   - `getSummary(studentId)` - Get attendance summary (attended/total)

2. Update `AttendanceController`:
   - `GET /v1/attendance` - List attendance (filters: student, schedule, date range)
   - `POST /v1/attendance` - Mark attendance (teacher)
   - `GET /v1/students/:id/attendance/summary` - Attendance summary

3. Add email trigger: When `status = 'no_show'`, queue alert email to site admin

**Web Tasks:**
1. Implement `MyDayPage`:
   - Today's sessions list (from teacher's schedules)
   - Each session card: student initials, time, status buttons
   - Status buttons: Present (green), No-Show (red), Cancelled (gray)
   - On No-Show/Cancelled: Show reason dropdown
   - "Other" option shows text input
   - Sticky footer: "X of Y marked"
   - Undo snackbar

2. Add attendance summary component for student details

**Files:**
- `apps/api/src/domains/attendance/services/AttendanceService.ts`
- `apps/api/src/domains/attendance/endpoints/AttendanceController.ts`
- `apps/web/src/domains/teachers/pages/MyDayPage.tsx`
- `apps/web/src/domains/students/components/AttendanceSummary.tsx` (new)

---

## Phase 7: Document Management

### Chunk 7.1: File Upload System

**Goal:** Upload and manage documents (audiograms, IEPs, CVs).

**API Tasks:**
1. Create `DocumentsService`:
   - `getUploadUrl(entityType, entityId, documentType, fileName)` - Get S3 presigned upload URL
   - `confirmUpload(data)` - Create document record after upload
   - `listForEntity(entityType, entityId)` - List documents
   - `getDownloadUrl(documentId)` - Get S3 presigned download URL
   - `delete(documentId)` - Delete document

2. Create `DocumentsController`:
   - `POST /v1/documents/upload-url` - Get presigned upload URL
   - `POST /v1/documents` - Confirm upload, create record
   - `GET /v1/students/:id/documents` - List student documents
   - `GET /v1/teachers/:id/documents` - List teacher documents (CV)
   - `GET /v1/documents/:id/download` - Get download URL
   - `DELETE /v1/documents/:id` - Delete document

3. Implement audiogram due date logic:
   - On create: `next_due_date = document_date + 6 months`
   - Query for overdue audiograms

**Web Tasks:**
1. Implement `UploadDocumentModal`:
   - Document type dropdown
   - Date picker (for audiograms)
   - File picker
   - Upload progress indicator
   - Direct S3 upload using presigned URL

2. Add document list to student details:
   - Type badges
   - Due date display for audiograms
   - Warning for overdue
   - Download links

3. Add CV upload to teacher details

**Files:**
- `apps/api/src/domains/documents/services/DocumentsService.ts` (new)
- `apps/api/src/domains/documents/endpoints/DocumentsController.ts` (new)
- `apps/api/src/s3/index.ts` (update with presigned URL helpers)
- `apps/web/src/domains/students/pages/UploadDocumentModal.tsx`
- `apps/web/src/domains/students/components/DocumentList.tsx` (new)

---

## Phase 8: Bulletin Board

### Chunk 8.1: Bulletin System

**Goal:** Role-filtered announcements with attachments.

**API Tasks:**
1. Implement `BulletinsService`:
   - `index(filters, userRole, siteId)` - List bulletins (filtered)
   - `show(id)` - Bulletin details with attachments
   - `create(data, attachments)` - Create bulletin (admin)
   - `update(id, data)` - Update bulletin
   - `delete(id)` - Delete bulletin
   - `addAttachment(bulletinId, fileData)` - Add attachment

2. Update `BulletinsController`:
   - `GET /v1/bulletins` - List bulletins (filtered by role/site)
   - `GET /v1/bulletins/:id` - Bulletin details
   - `POST /v1/bulletins` - Create bulletin (admin)
   - `PATCH /v1/bulletins/:id` - Update bulletin (admin)
   - `DELETE /v1/bulletins/:id` - Delete bulletin (admin)
   - `POST /v1/bulletins/:id/attachments` - Add attachment

**Web Tasks:**
1. Implement `BulletinBoardPage`:
   - Feed view sorted by publish_at
   - Filter by site (if admin)
   - Each bulletin card: title, body preview, attachments, date
   - "Create Bulletin" button (admin only)

2. Implement create bulletin modal:
   - Title, body (rich text optional)
   - Scope: Global or Site-specific
   - Role target dropdown
   - Publish date picker
   - File attachments
   
3. Attachment display/download

**Files:**
- `apps/api/src/domains/bulletins/services/BulletinsService.ts`
- `apps/api/src/domains/bulletins/endpoints/BulletinsController.ts`
- `apps/web/src/domains/bulletin/pages/BulletinBoardPage.tsx`
- `apps/web/src/domains/bulletin/components/CreateBulletinModal.tsx` (new)
- `apps/web/src/domains/bulletin/services/BulletinHttpService.ts`

---

## Phase 9: Parent Portal

### Chunk 9.1: Parent Features

**Goal:** Parents can view their linked children.

**API Tasks:**
1. Implement `ParentsService`:
   - `getMyStudents(parentUserId)` - Get linked children
   - `getChildDetails(parentUserId, studentId)` - Get child details (scoped)

2. Update `ParentsController`:
   - `GET /v1/parents/my-students` - List linked children
   - `GET /v1/parents/children/:studentId` - Child details

**Web Tasks:**
1. Implement `MyStudentsPage`:
   - Card grid of children
   - Each card: initials, next session, attendance chip
   - Pending request indicators
   - Tap → child details

2. Implement `ChildDetailsPage`:
   - Read-only schedule (upcoming sessions)
   - Attendance summary
   - Relevant bulletins
   - Missed sessions with "Request Make-Up" button
   - "Request Schedule Change" link

**Files:**
- `apps/api/src/domains/parents/services/ParentsService.ts`
- `apps/api/src/domains/parents/endpoints/ParentsController.ts`
- `apps/web/src/domains/parents/pages/MyStudentsPage.tsx`
- `apps/web/src/domains/parents/pages/ChildDetailsPage.tsx`
- `apps/web/src/domains/parents/services/ParentHttpService.ts`

---

## Phase 10: Session Notes

### Chunk 10.1: Teacher Session Notes

**Goal:** Teachers can add quick notes about sessions.

**API Tasks:**
1. Create `SessionNotesService`:
   - `create(studentId, teacherId, data)` - Add note
   - `listForStudent(studentId)` - List notes for student

2. Create `SessionNotesController`:
   - `POST /v1/students/:id/notes` - Add note (teacher)
   - `GET /v1/students/:id/notes` - List notes

**Web Tasks:**
1. Implement note modal on teacher's student view:
   - Text area
   - Optional date picker
   - Save button

2. Add notes timeline to student details:
   - Show recent notes
   - Teacher name, date, note text

**Files:**
- `apps/api/src/domains/notes/services/SessionNotesService.ts` (new)
- `apps/api/src/domains/notes/endpoints/SessionNotesController.ts` (new)
- `apps/web/src/domains/teachers/pages/TeacherStudentDetailsPage.tsx`
- `apps/web/src/domains/students/components/SessionNotes.tsx` (new)

---

## Phase 11: Assessments

### Chunk 11.1: Pre/Post Assessment System

**Goal:** Teachers can record pre/post assessments.

**API Tasks:**
1. Create `AssessmentsService`:
   - `create(studentId, teacherId, data)` - Create assessment
   - `listForStudent(studentId)` - List assessments by cycle
   - `getForCycle(studentId, cycleStartDate)` - Get pre/post for a cycle

2. Create `AssessmentsController`:
   - `POST /v1/students/:id/assessments` - Create assessment (teacher)
   - `GET /v1/students/:id/assessments` - List assessments

**Web Tasks:**
1. Implement assessment modal:
   - Type: Pre or Post dropdown
   - Cycle start date (defaults to current)
   - Teaching focus text area
   - Score slider/input (0-20)
   - Notes (optional)

2. Add assessment history to student details:
   - Table: Cycle, Pre Score, Post Score, Improvement
   - Visual progress indicator

**Files:**
- `apps/api/src/domains/assessments/services/AssessmentsService.ts` (new)
- `apps/api/src/domains/assessments/endpoints/AssessmentsController.ts` (new)
- `apps/web/src/domains/teachers/components/AddAssessmentModal.tsx` (new)
- `apps/web/src/domains/students/components/AssessmentHistory.tsx` (new)

---

## Phase 12: Profile & Settings

### Chunk 12.1: My Profile

**Goal:** All users can view/edit their profile.

**API Tasks:**
1. Implement `MeService`:
   - `getProfile(userId)` - Get current user's profile
   - `updateProfile(userId, data)` - Update profile

2. Update `MeController`:
   - `GET /v1/me` - Get profile
   - `PATCH /v1/me` - Update profile

**Web Tasks:**
1. Implement `MyProfilePage`:
   - Display: name, email, phone, locale
   - Edit form
   - Save button

**Files:**
- `apps/api/src/domains/me/services/MeService.ts`
- `apps/api/src/domains/me/endpoints/MeController.ts`
- `apps/web/src/domains/users/pages/MyProfilePage.tsx`

---

## Phase 13: Make-Up Classes

### Chunk 13.1: Make-Up Class Workflow

**Goal:** Parents request make-ups, admins approve, teachers host.

**API Tasks:**
1. Create `MakeupService`:
   - `createRequest(parentId, studentId, data)` - Create request
   - `listRequests(filters, userRole)` - List requests
   - `reviewRequest(requestId, adminId, status, notes)` - Approve/deny
   - `createSession(data)` - Create make-up session
   - `listSessions(teacherId)` - Teacher's make-up sessions
   - `markSessionAttendance(sessionId, status)` - Mark attendance

2. Create `MakeupController`:
   - `POST /v1/makeup-requests` - Create request (parent)
   - `GET /v1/makeup-requests` - List requests
   - `PATCH /v1/makeup-requests/:id` - Review request (admin)
   - `POST /v1/makeup-sessions` - Create session (admin/teacher)
   - `GET /v1/teachers/:id/makeup-sessions` - Teacher's sessions
   - `PATCH /v1/makeup-sessions/:id/attendance` - Mark attendance

**Web Tasks:**
1. Parent: Add "Request Make-Up" button to missed sessions
2. Parent: Request modal (select session, reason, preferred dates)
3. Parent: My requests list with status

4. Admin: Make-up requests dashboard
   - List of pending requests
   - Approve/deny actions
   - Create session on approval

5. Teacher: Make-up sessions list on My Day
   - Same attendance UI as regular sessions

**Files:**
- `apps/api/src/domains/makeups/services/MakeupService.ts` (new)
- `apps/api/src/domains/makeups/endpoints/MakeupController.ts` (new)
- `apps/web/src/domains/parents/components/RequestMakeupModal.tsx` (new)
- `apps/web/src/domains/parents/pages/MyRequestsPage.tsx` (new)
- `apps/web/src/domains/admin/pages/MakeupRequestsPage.tsx` (new)
- `apps/web/src/domains/teachers/components/MakeupSessionsList.tsx` (new)

---

## Phase 14: Schedule Change Requests

### Chunk 14.1: Schedule Change Workflow

**Goal:** Parents can browse and request schedule changes.

**API Tasks:**
1. Create `ScheduleChangeService`:
   - `createRequest(parentId, studentId, data)` - Create request
   - `listRequests(filters, userRole)` - List requests
   - `reviewRequest(requestId, adminId, status, notes)` - Approve/deny
   - On approval: Update student enrollment

2. Create `ScheduleChangeController`:
   - `POST /v1/schedule-change-requests` - Create request (parent)
   - `GET /v1/schedule-change-requests` - List requests
   - `PATCH /v1/schedule-change-requests/:id` - Review request (admin)

**Web Tasks:**
1. Parent: Browse available schedules page
   - Filters: location, days (M/W/S or T/Th/S), time, teacher specialty
   - Schedule cards with teacher info
   - "Request This Schedule" button

2. Parent: Request modal (reason text)

3. Parent: My requests list (shared with make-up requests page)

4. Admin: Schedule change requests dashboard
   - List of pending requests
   - Show current vs requested schedule
   - Approve/deny actions

**Files:**
- `apps/api/src/domains/schedule-changes/services/ScheduleChangeService.ts` (new)
- `apps/api/src/domains/schedule-changes/endpoints/ScheduleChangeController.ts` (new)
- `apps/web/src/domains/parents/pages/BrowseSchedulesPage.tsx` (new)
- `apps/web/src/domains/admin/pages/ScheduleChangeRequestsPage.tsx` (new)

---

## Phase 15: Notifications & Polish

### Chunk 15.1: Email Notifications

**Goal:** Automated email alerts.

**Tasks:**
1. Install Resend: `npm install resend`

2. Create email service in `apps/api/src/email/`:
   - `sendMissedSessionAlert(adminEmail, studentName, date, teacherName)`
   - `sendBirthdayNotification(recipientEmail, studentName, birthday, age)`
   - `sendAudiogramReminder(adminEmail, studentName, dueDate)`

3. Implement triggers:
   - **Missed session**: On attendance marked as `no_show`, send to site admin immediately
   - **Birthday**: Cron job (daily at 8am) checks for birthdays in next 7 days
   - **Audiogram**: Cron job (weekly) checks for due dates in next 30 days

4. Setup node-cron for scheduled jobs

**Files:**
- `apps/api/src/email/index.ts` (new)
- `apps/api/src/email/templates/` (new)
- `apps/api/src/cron/index.ts` (new)
- `apps/api/src/cron/birthdayJob.ts` (new)
- `apps/api/src/cron/audiogramJob.ts` (new)

---

### Chunk 15.2: Security & UX Audit

**Goal:** Final polish and compliance.

**Tasks:**
1. **PII Protection Audit**:
   - Verify lists show initials only
   - Verify full names only on authorized detail pages
   - Check all API responses for PII leaks

2. **Role-Based Access Audit**:
   - Verify all admin routes check role
   - Verify parents only see linked children
   - Verify teachers only see assigned students

3. **Mobile Responsiveness**:
   - Test all pages on mobile viewport
   - Fix any layout issues
   - Ensure touch targets are large enough

4. **Error Handling**:
   - Add error boundaries
   - User-friendly error messages
   - Loading states for all async operations

5. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Color contrast

**Files:**
- All pages/components (audit and fix as needed)

---

## Dependencies

```
Phase 1 (Data Model) ─┬─► Phase 2 (Auth)
                      │
                      ├─► Phase 3 (Locations)
                      │
                      └─► All other phases

Phase 2 (Auth) ──────────► Phase 3-15 (all need auth)

Phase 4 (Teachers) ──────► Phase 6 (Attendance)
                     │
                     └───► Phase 11 (Assessments)

Phase 5 (Students) ──────► Phase 7 (Documents)
                     │
                     ├───► Phase 10 (Notes)
                     │
                     ├───► Phase 11 (Assessments)
                     │
                     └───► Phase 13, 14 (Make-ups, Schedule Changes)

Phase 9 (Parent Portal) ─► Phase 13, 14 (Make-ups, Schedule Changes)
```

---

## Estimated Chunk Sizes

| Chunk | Estimated Effort | Notes |
|-------|------------------|-------|
| 1.1 | Medium | Schema fixes, many small changes |
| 1.2 | Large | Many new tables |
| 2.1 | Medium | Auth setup |
| 2.2 | Medium | User CRUD |
| 3.1 | Large | Map integration |
| 4.1 | Medium | Teacher profiles |
| 4.2 | Large | Schedule wizard |
| 5.1 | Large | Student CRUD + siblings |
| 5.2 | Small | Linking modals |
| 6.1 | Large | Attendance with UI |
| 7.1 | Large | S3 integration |
| 8.1 | Medium | Bulletins |
| 9.1 | Medium | Parent views |
| 10.1 | Small | Notes feature |
| 11.1 | Medium | Assessments |
| 12.1 | Small | Profile page |
| 13.1 | Large | Make-up workflow |
| 14.1 | Large | Schedule change workflow |
| 15.1 | Medium | Email notifications |
| 15.2 | Medium | Audit and fixes |
