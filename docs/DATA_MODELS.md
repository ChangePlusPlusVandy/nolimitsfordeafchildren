# Data Models

This document describes the **target/ideal** database schema for the No Limits for Deaf Children platform.

> **Note:** The current codebase may have bugs or incomplete implementations. This document represents the correct schema that should be implemented.

---

## Enums

### `user_role`
```sql
CREATE TYPE user_role AS ENUM ('administrator', 'teacher', 'parent');
```

### `location_type`
```sql
CREATE TYPE location_type AS ENUM ('education_center', 'pop_up', 'remote');
```

### `attendance_status`
```sql
CREATE TYPE attendance_status AS ENUM ('present', 'no_show', 'cancelled');
```

### `absence_reason`
```sql
CREATE TYPE absence_reason AS ENUM (
  'sick',
  'family_emergency',
  'transportation',
  'schedule_conflict',
  'no_show_unknown',
  'other'
);
```

### `document_type`
```sql
CREATE TYPE document_type AS ENUM ('audiogram', 'iep', 'cv', 'annual_test_result', 'other');
```

### `assessment_type`
```sql
CREATE TYPE assessment_type AS ENUM ('pre', 'post');
```

### `age_group_specialty`
```sql
CREATE TYPE age_group_specialty AS ENUM (
  'infant',
  'toddler',
  'preschool',
  'elementary',
  'middle_school',
  'high_school',
  'young_adult',
  'all_ages'
);
```

### `request_status`
```sql
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied', 'completed');
```

### `bulletin_scope`
```sql
CREATE TYPE bulletin_scope AS ENUM ('global', 'site');
```

### `bulletin_role_target`
```sql
CREATE TYPE bulletin_role_target AS ENUM ('all', 'administrator', 'teacher', 'parent');
```

---

## Core Tables

### `users`

The base user account for all roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `auth0_id` | text | NOT NULL, UNIQUE | Auth0 subject ID |
| `email` | citext | NOT NULL, UNIQUE | Email address (case-insensitive) |
| `name` | text | NOT NULL | Full name |
| `phone` | text | | Phone number |
| `locale` | text | NOT NULL, default 'en-US' | Preferred locale |
| `role` | user_role | NOT NULL | User role |
| `is_active` | boolean | NOT NULL, default true | Account active status |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `users_auth0_id_idx` on `auth0_id`
- `users_email_idx` on `email`
- `users_role_idx` on `role`

---

### `teacher_profiles`

Extended profile for users with `role = 'teacher'`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `user_id` | uuid | NOT NULL, FK → users.id, UNIQUE | Link to user |
| `primary_site_id` | uuid | FK → locations.id | Primary teaching location |
| `bio` | text | | Teacher biography |
| `photo_url` | text | | Profile photo URL (S3) |
| `qualifications` | text | | Qualifications summary |
| `credentials` | text | | Credentials/certifications |
| `age_group_specialty` | age_group_specialty | default 'all_ages' | Teaching specialty |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `teacher_profiles_user_id_idx` on `user_id`
- `teacher_profiles_site_id_idx` on `primary_site_id`

---

### `parent_profiles`

Extended profile for users with `role = 'parent'`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `user_id` | uuid | NOT NULL, FK → users.id, UNIQUE | Link to user |
| `household_notes` | text | | Notes about household |
| `preferred_contact_method` | text | NOT NULL, default 'email' | Preferred contact method |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `parent_profiles_user_id_idx` on `user_id`

---

### `locations`

Education centers and pop-up sites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `name` | text | NOT NULL | Location name |
| `type` | location_type | NOT NULL | Education center or pop-up |
| `address_line1` | text | NOT NULL | Street address |
| `address_line2` | text | | Suite, unit, etc. |
| `city` | text | NOT NULL | City |
| `state` | text | NOT NULL | State/province |
| `postal_code` | text | NOT NULL | ZIP/postal code |
| `country` | text | NOT NULL, default 'USA' | Country |
| `latitude` | numeric(9,6) | | GPS latitude |
| `longitude` | numeric(9,6) | | GPS longitude |
| `timezone` | text | NOT NULL, default 'America/Los_Angeles' | IANA timezone |
| `zoom_link` | text | | Zoom meeting URL |
| `is_active` | boolean | NOT NULL, default true | Location active status |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `locations_type_idx` on `type`
- `locations_active_idx` on `is_active`

---

### `students`

Student records (children enrolled in the program).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `site_id` | uuid | NOT NULL, FK → locations.id | **Single** assigned location |
| `first_name` | text | NOT NULL | First name (PII) |
| `last_name` | text | NOT NULL | Last name (PII) |
| `initials` | varchar(8) | NOT NULL | Display initials (for lists) |
| `dob` | date | NOT NULL | Date of birth |
| `current_school` | text | | Current school name |
| `preferred_language` | text | NOT NULL, default 'English' | Preferred language |
| `guardian_summary` | text | | Guardian/family notes |
| `is_active` | boolean | NOT NULL, default true | Enrollment status |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `students_site_id_idx` on `site_id`
- `students_dob_idx` on `dob` (for birthday queries)
- `students_active_idx` on `is_active`

---

### `siblings`

Sibling information for students (for lesson context).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Parent student |
| `name` | text | NOT NULL | Sibling name |
| `age` | integer | | Sibling age |
| `relationship` | text | NOT NULL | e.g., 'brother', 'sister' |
| `photo_url` | text | | Sibling photo URL (S3) |
| `notes` | text | | Additional notes |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `siblings_student_id_idx` on `student_id`

---

## Scheduling Tables

### `schedules`

Teacher schedules (recurring time slots).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `teacher_id` | uuid | NOT NULL, FK → teacher_profiles.id | Assigned teacher |
| `site_id` | uuid | NOT NULL, FK → locations.id | Location |
| `day_of_week_mask` | integer | NOT NULL | Bitmask: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64 |
| `start_time` | time | NOT NULL | Session start time |
| `end_time` | time | NOT NULL | Session end time |
| `cycle_start_date` | date | NOT NULL | 10-week cycle start |
| `cycle_end_date` | date | NOT NULL | 10-week cycle end |
| `is_active` | boolean | NOT NULL, default true | Schedule active |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `schedules_teacher_id_idx` on `teacher_id`
- `schedules_site_id_idx` on `site_id`
- `schedules_active_idx` on `is_active`

**Day of Week Mask Examples:**
- M/W/S (Mon=2, Wed=8, Sat=64) = 74
- T/Th/S (Tue=4, Thu=16, Sat=64) = 84

---

### `enrollments`

Student enrollment in schedules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Enrolled student |
| `schedule_id` | uuid | NOT NULL, FK → schedules.id | Assigned schedule |
| `enrolled_at` | timestamptz | NOT NULL, default now() | Enrollment date |
| `ended_at` | timestamptz | | Unenrollment date (if ended) |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `enrollments_student_id_idx` on `student_id`
- `enrollments_schedule_id_idx` on `schedule_id`

**Unique Constraint:** `(student_id, schedule_id)` where `ended_at IS NULL`

---

## Junction Tables

### `teacher_student`

Many-to-many: Teachers ↔ Students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `teacher_id` | uuid | NOT NULL, FK → teacher_profiles.id | Teacher |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `assigned_at` | timestamptz | NOT NULL, default now() | Assignment date |
| `unassigned_at` | timestamptz | | Removal date (soft delete) |

**Indexes:**
- `teacher_student_teacher_id_idx` on `teacher_id`
- `teacher_student_student_id_idx` on `student_id`

**Unique Constraint:** `(teacher_id, student_id)` where `unassigned_at IS NULL`

---

### `parent_student_link`

Many-to-many: Parents ↔ Students.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `parent_id` | uuid | NOT NULL, FK → parent_profiles.id | Parent |
| `student_id` | uuid | NOT NULL, FK → students.id | Child |
| `relationship` | text | | e.g., 'mother', 'father', 'guardian' |
| `is_primary` | boolean | NOT NULL, default false | Primary contact |
| `linked_at` | timestamptz | NOT NULL, default now() | Link date |
| `revoked_at` | timestamptz | | Removal date (soft delete) |

**Indexes:**
- `parent_student_parent_id_idx` on `parent_id`
- `parent_student_student_id_idx` on `student_id`

**Unique Constraint:** `(parent_id, student_id)` where `revoked_at IS NULL`

---

## Attendance & Notes

### `attendance`

Session attendance records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `schedule_id` | uuid | NOT NULL, FK → schedules.id | Schedule |
| `session_date` | date | NOT NULL | Date of session |
| `status` | attendance_status | NOT NULL | Present/No-show/Cancelled |
| `reason` | absence_reason | | Reason (if not present) |
| `reason_text` | text | | Custom reason (if 'other') |
| `marked_by` | uuid | NOT NULL, FK → users.id | Teacher who marked |
| `marked_at` | timestamptz | NOT NULL, default now() | When marked |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `attendance_student_id_idx` on `student_id`
- `attendance_schedule_id_idx` on `schedule_id`
- `attendance_date_idx` on `session_date`
- `attendance_status_idx` on `status`

**Unique Constraint:** `(student_id, schedule_id, session_date)`

---

### `session_notes`

Quick notes from teachers about sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `teacher_id` | uuid | NOT NULL, FK → teacher_profiles.id | Teacher who wrote note |
| `schedule_id` | uuid | FK → schedules.id | Related schedule (optional) |
| `session_date` | date | | Session date (optional) |
| `note` | text | NOT NULL | Note content |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `session_notes_student_id_idx` on `student_id`
- `session_notes_teacher_id_idx` on `teacher_id`

---

### `assessments`

Pre/post assessments for 10-week cycles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `teacher_id` | uuid | NOT NULL, FK → teacher_profiles.id | Assessing teacher |
| `cycle_start_date` | date | NOT NULL | 10-week cycle start |
| `assessment_type` | assessment_type | NOT NULL | Pre or post |
| `teaching_focus` | text | NOT NULL | What they're teaching |
| `score` | integer | NOT NULL, CHECK (0-20) | Score out of 20 |
| `notes` | text | | Additional notes |
| `assessed_at` | timestamptz | NOT NULL, default now() | Assessment date |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `assessments_student_id_idx` on `student_id`
- `assessments_teacher_id_idx` on `teacher_id`
- `assessments_cycle_idx` on `cycle_start_date`

**Unique Constraint:** `(student_id, cycle_start_date, assessment_type)`

---

## Documents

### `documents`

File uploads (audiograms, IEPs, CVs, test results).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `entity_type` | text | NOT NULL | 'student' or 'teacher' |
| `entity_id` | uuid | NOT NULL | ID of student or teacher |
| `document_type` | document_type | NOT NULL | Type of document |
| `file_url` | text | NOT NULL | S3 URL |
| `file_name` | text | NOT NULL | Original filename |
| `file_size` | integer | | File size in bytes |
| `mime_type` | text | | MIME type |
| `document_date` | date | | Date on document (e.g., audiogram test date) |
| `next_due_date` | date | | Computed next due date (audiograms) |
| `uploaded_by` | uuid | NOT NULL, FK → users.id | Who uploaded |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `documents_entity_idx` on `(entity_type, entity_id)`
- `documents_type_idx` on `document_type`
- `documents_due_date_idx` on `next_due_date`

**Business Logic:**
- For audiograms: `next_due_date = document_date + 6 months`

---

## Bulletins

### `bulletins`

Announcements and reminders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `site_id` | uuid | FK → locations.id | Site-specific (null = global) |
| `scope` | bulletin_scope | NOT NULL, default 'global' | Global or site-specific |
| `role_target` | bulletin_role_target | NOT NULL, default 'all' | Target audience |
| `title` | text | NOT NULL | Bulletin title |
| `body` | text | | Bulletin content |
| `publish_at` | timestamptz | | Scheduled publish time |
| `expire_at` | timestamptz | | Expiration time |
| `created_by` | uuid | NOT NULL, FK → users.id | Author |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `bulletins_site_id_idx` on `site_id`
- `bulletins_publish_idx` on `publish_at`
- `bulletins_role_idx` on `role_target`

---

### `bulletin_attachments`

File attachments for bulletins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `bulletin_id` | uuid | NOT NULL, FK → bulletins.id | Parent bulletin |
| `file_url` | text | NOT NULL | S3 URL |
| `file_name` | text | NOT NULL | Original filename |
| `file_size` | integer | | File size in bytes |
| `mime_type` | text | | MIME type |
| `created_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `bulletin_attachments_bulletin_id_idx` on `bulletin_id`

---

## Make-Up System

### `makeup_requests`

Parent requests for make-up classes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `original_session_date` | date | NOT NULL | Missed session date |
| `original_schedule_id` | uuid | NOT NULL, FK → schedules.id | Original schedule |
| `reason` | absence_reason | NOT NULL | Reason for absence |
| `reason_text` | text | | Custom reason (if 'other') |
| `preferred_dates` | text | | Parent's preferred dates |
| `status` | request_status | NOT NULL, default 'pending' | Request status |
| `requested_by` | uuid | NOT NULL, FK → users.id | Parent who requested |
| `requested_at` | timestamptz | NOT NULL, default now() | |
| `reviewed_by` | uuid | FK → users.id | Admin who reviewed |
| `reviewed_at` | timestamptz | | Review timestamp |
| `review_notes` | text | | Admin notes on decision |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `makeup_requests_student_id_idx` on `student_id`
- `makeup_requests_status_idx` on `status`
- `makeup_requests_requested_by_idx` on `requested_by`

---

### `makeup_sessions`

Scheduled make-up sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `makeup_request_id` | uuid | FK → makeup_requests.id | Related request |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `teacher_id` | uuid | NOT NULL, FK → teacher_profiles.id | Assigned teacher |
| `site_id` | uuid | NOT NULL, FK → locations.id | Location |
| `scheduled_date` | date | NOT NULL | Make-up date |
| `scheduled_time` | time | NOT NULL | Make-up time |
| `attendance_status` | attendance_status | | Attendance (once completed) |
| `notes` | text | | Session notes |
| `created_by` | uuid | NOT NULL, FK → users.id | Who created |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `makeup_sessions_student_id_idx` on `student_id`
- `makeup_sessions_teacher_id_idx` on `teacher_id`
- `makeup_sessions_date_idx` on `scheduled_date`

---

## Schedule Change System

### `schedule_change_requests`

Parent requests to change schedules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default random | Unique identifier |
| `student_id` | uuid | NOT NULL, FK → students.id | Student |
| `current_schedule_id` | uuid | NOT NULL, FK → schedules.id | Current schedule |
| `requested_schedule_id` | uuid | NOT NULL, FK → schedules.id | Desired schedule |
| `reason` | text | NOT NULL | Reason for change |
| `status` | request_status | NOT NULL, default 'pending' | Request status |
| `requested_by` | uuid | NOT NULL, FK → users.id | Parent who requested |
| `requested_at` | timestamptz | NOT NULL, default now() | |
| `reviewed_by` | uuid | FK → users.id | Admin who reviewed |
| `reviewed_at` | timestamptz | | Review timestamp |
| `review_notes` | text | | Admin notes on decision |
| `created_at` | timestamptz | NOT NULL, default now() | |
| `updated_at` | timestamptz | NOT NULL, default now() | |

**Indexes:**
- `schedule_change_requests_student_id_idx` on `student_id`
- `schedule_change_requests_status_idx` on `status`
- `schedule_change_requests_requested_by_idx` on `requested_by`

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   users     │──1:1──│ teacher_profiles │──M:N──│  students   │
│             │       │                  │       │             │
│  - role     │       │ - specialty      │       │ - site_id   │
│  - email    │       │ - bio            │       │ - dob       │
└─────────────┘       └──────────────────┘       └─────────────┘
      │                       │                        │
      │ 1:1                   │ 1:N                    │ 1:N
      ▼                       ▼                        ▼
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│  parent_    │──M:N──│   schedules      │       │  siblings   │
│  profiles   │       │                  │       │             │
└─────────────┘       │ - day_of_week    │       │ - name      │
                      │ - times          │       │ - age       │
                      └──────────────────┘       └─────────────┘
                              │
                              │ 1:N
                              ▼
                      ┌──────────────────┐
                      │   enrollments    │
                      │   attendance     │
                      │   assessments    │
                      │   session_notes  │
                      └──────────────────┘

┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│  locations  │──1:N──│   bulletins      │──1:N──│ bulletin_   │
│             │       │                  │       │ attachments │
│ - type      │       │ - scope          │       └─────────────┘
│ - zoom_link │       │ - role_target    │
└─────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│ makeup_requests  │──1:1──│  makeup_sessions │
│                  │       │                  │
│ - reason         │       │ - scheduled_date │
│ - status         │       │ - teacher_id     │
└──────────────────┘       └──────────────────┘

┌────────────────────────┐
│ schedule_change_       │
│ requests               │
│                        │
│ - current_schedule_id  │
│ - requested_schedule_id│
│ - status               │
└────────────────────────┘

┌─────────────┐
│  documents  │
│             │
│ - entity_*  │
│ - type      │
│ - due_date  │
└─────────────┘
```

---

## Known Issues in Current Codebase

The following issues exist in the current implementation and should be fixed:

1. **BulletinTable** - Table name is `"locations"` instead of `"bulletins"` (BUG)
2. **TeacherProfileTable.primary_site_id** - References `UserTable.locale` instead of `LocationTable.id` (BUG)
3. **ParentProfileTable** - Missing primary key
4. **Column typos**: `guardian_sumarry` → `guardian_summary`, `updtated_at` → `updated_at`
5. **UserTable** - Missing `role` field, `email` is commented out
6. **LocationTable** - Missing `type` and `zoom_link` fields
7. **AttendanceTable** - Missing `status` enum field (commented out)
8. **Missing tables**: `siblings`, `assessments`, `documents`, `session_notes`, `makeup_*`, `schedule_change_requests`, `bulletin_attachments`
9. **db/schema.ts** - Only exports `UserTable`, not all tables
10. **Missing Drizzle relations** - No `relations()` definitions for ORM joins
