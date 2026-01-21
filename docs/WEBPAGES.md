# No Limits — v0 Routes & Pages

**Version:** v0  
**Scope:** Admin + Teacher + Parent  
**Time/Zone:** Store timestamps in **UTC**; render per user locale (e.g., PST for LA)  
**PII:** Lists show **student initials**; full PII only on authorized detail pages

---

## Conventions

### Roles
- `administrator` - Full access to all features
- `teacher` - Manage sessions, attendance, notes, assessments
- `parent` - View children, request make-ups and schedule changes

### IDs
UUIDs in paths: `:siteId`, `:teacherId`, `:studentId`, `:requestId`

### Enums

| Enum | Values |
|------|--------|
| **Location Type** | `education_center`, `pop_up` |
| **Attendance Status** | `present`, `no_show`, `cancelled` |
| **Absence Reason** | `sick`, `family_emergency`, `transportation`, `schedule_conflict`, `no_show_unknown`, `other` |
| **Document Type** | `audiogram`, `iep`, `cv`, `annual_test_result`, `other` |
| **Assessment Type** | `pre`, `post` |
| **Age Group Specialty** | `infant`, `toddler`, `preschool`, `elementary`, `middle_school`, `high_school`, `young_adult`, `all_ages` |
| **Request Status** | `pending`, `approved`, `denied`, `completed` |

### UI Patterns
- Heavy create/edit flows are **pages**
- Quick actions are **modal routes** (drawers/dialogs) with their own URLs
- **Map Pins:** **Green** = active session now; **Red** = no sessions now

### Business Rules
- **Student Location:** Each student belongs to **exactly one** location
- **Teacher Schedules:** Teachers can have **multiple schedules** (e.g., Saturday). **Admins edit; teachers read-only**
- **Audiogram Compliance:** Due every 6 months; `next_due = audiogram_date + 6 months`
- **Assessment Cycles:** Pre/post assessments every 10-week cycle, scored 0-20

---

## Global (All Roles)

### `/login`
**Sign-in**. Google SSO for staff; email/MFA for parents.

### `/my-profile`
**Profile & preferences**. Update name, email, phone, locale; parents can change password/MFA.

### `/bulletin`
**Announcements**. Role/site-filtered feed with file attachments.  
- **Admin** can create bulletins via modal with role targeting and file uploads
- Filter by: site (global or specific), role visibility

---

## Administrator

### User Management

#### `/users`
**User management** (admins, teachers, parents).  
Actions: invite (modal), enable/disable, change role, assign sites.

#### `/users/invite?role=teacher|parent|admin` _(modal)_
**Invite user**. Fields: email, role, default site assignments.

---

### Location Management

#### `/locations`
**Map + list** of locations with live status.  
- Uses **react-leaflet** with OpenStreetMap tiles
- Pin logic: **Green** (active session now), **Red** (no one on site)
- Actions: open location, **create** location (page)

#### `/locations/new` _(page)_
**Create location**. Fields:
- Name, address (line1, line2, city, state, postal, country)
- Latitude/longitude (geo picker)
- **Type**: `education_center` or `pop_up`
- Timezone
- **Zoom link** (for remote sessions)
- Coordinators

#### `/locations/:siteId`
**Location overview**. Sections:
- Who's here **now/next** (computed from schedules)
- Teacher roster (with specialties)
- Student roster (initials only)
- Links: teacher detail, student detail, edit location

#### `/locations/:siteId/edit` _(page)_
**Edit location** metadata (address/geo, type, timezone, zoom link, coordinators).

---

### Teacher Management

#### `/teachers/new` _(page)_
**Create teacher**. Fields:
- Name, email, phone
- Primary site assignment
- **Age group specialty** (dropdown)
- Bio, qualifications, credentials (optional)

#### `/teachers/:id`
**Teacher detail (admin view)**.  
Sections:
- Profile: bio, photo, qualifications, credentials, **age group specialty badge**
- CV document (if uploaded)
- Assigned students list
- Schedules list

Actions:
- Edit profile
- Upload CV
- **Create/edit schedules** (wizard)

#### `/teachers/:id/schedules/new` _(wizard page)_
**Create/append schedules** for a teacher.  
Steps:
1. Select pattern: M/W/S or T/Th/S
2. Set times (start/end)
3. Set cycle dates (10-week period)
4. Optional: Add Saturday session
5. Conflict check
6. Review & create

**Admin-only.**

---

### Student Management

#### `/students`
**Student management list** (admin view).  
- Data table with search, location filter, and active status filter
- PII protected: non-admins see initials only
- Actions: view details, create new student

#### `/students/new` _(page)_
**Create student**. Fields:
- First name, last name, initials
- DOB (for birthday tracking)
- **Single location** (required, dropdown)
- **Current school** (text)
- Preferred language
- Guardian summary
- Optional: link teachers, link parents

#### `/students/:id`
**Student detail (admin view)**.  
Sections:
- Profile: full PII, DOB, location, current school
- **Siblings**: Avatar row with hover cards (name, age, relationship)
- Linked teachers (multiple allowed)
- Linked parents
- Attendance summary (X of Y sessions attended)
- **Documents**: Audiograms (with due dates), IEPs, annual test results
- **Assessments**: Pre/post scores by cycle
- Session notes (from teachers)

Quick actions (modals):
- Link teacher
- **Link parent**
- Upload document
- Add sibling

#### `/students/:id/link-teacher` _(modal)_
**Add/remove teacher assignments** for student.

#### `/students/:id/link-parent` _(modal)_
**Add/remove parent assignments** for student. Admin-only.

#### `/students/:id/upload?type=audiogram|iep|annual_test_result` _(modal)_
**Upload documents** (PDFs).  
- For audiogram: set test date, system computes `next_due = date + 6 months`
- Show warning if audiogram is overdue

#### `/students/:id/siblings/new` _(modal)_
**Add sibling**. Fields: name, age, relationship, photo (optional).

---

### Request Management (Admin Dashboards)

#### `/admin/makeup-requests`
**Make-up request dashboard**. List of pending requests from parents.  
Actions: approve, deny (with notes).  
On approval: prompts to create make-up session or assign to teacher.

#### `/admin/schedule-change-requests`
**Schedule change request dashboard**. List of pending requests.  
Actions: approve, deny (with notes).  
On approval: student enrollment is updated automatically.

---

## Teachers

### `/teachers` → redirects to `/my-day`
Convenience route.

### `/my-day`
**Primary teacher workspace**. Today's sessions with inline attendance marking.

**Attendance UI:**
- Status buttons: Present (green), No-Show (red), Cancelled (gray)
- On No-Show/Cancelled: **Reason dropdown** appears
  - Options: Sick, Family Emergency, Transportation, Schedule Conflict, No-Show (Unknown), Other
  - "Other" shows text input for custom reason
- Sticky footer: "X of Y marked"
- Undo snackbar for recent changes

**Make-up sessions:** Separate section showing any scheduled make-up sessions for today.

Tap student → student detail.

### `/teachers/students/:id`
**Student detail (teacher-scoped)**.  
Sections:
- Read-only schedule
- Attendance summary (sessions attended/missed)
- **Siblings**: Avatar row with hover cards
- Session notes (teacher can view/add)
- **Assessments**: View/add pre/post scores

Actions:
- Add quick note (modal)
- **Add assessment** (modal)

(No schedule edit; no document uploads.)

### `/teachers/students/:id/note-new` _(modal)_
**Add quick session note** (short text, auto-dated).

### `/teachers/students/:id/assessment-new` _(modal)_
**Add pre/post assessment**.  
Fields:
- Assessment type: `pre` or `post`
- Cycle start date (defaults to current cycle)
- Teaching focus (text - what they're working on)
- Score (0-20)
- Notes (optional)

### `/teachers/makeup-sessions`
**Teacher's make-up sessions**. List of approved make-up sessions assigned to this teacher.  
Actions: Mark attendance (same UI as regular sessions).

---

## Parents

### `/parents` → redirects to `/my-students`
Convenience route.

### `/my-students`
**Linked children list**. Cards showing:
- Child initials (PII protected)
- Next session time
- Attendance/progress chip (e.g., "8/10 attended")
- Make-up request status (if any pending)

Tap → child detail.

### `/parents/children/:studentId`
**Child detail (read-only)**.  
Sections:
- Weekly schedule (upcoming sessions)
- Attendance summary
- Relevant bulletins
- **Missed sessions** with "Request Make-Up" button

Actions:
- **Request make-up** (modal) - for missed sessions
- **Request schedule change** (page)

### `/parents/children/:studentId/makeup-request` _(modal)_
**Request make-up class**.  
Fields:
- Select missed session (from list)
- Reason: Sick, Family Emergency, Transportation, Weather, Other (+text)
- Preferred dates (optional)

Status tracking: Parent can see pending/approved/denied requests.

### `/parents/schedule-change`
**Browse available schedules & request change**.  
Steps:
1. Browse available schedules with filters:
   - Location
   - Days (M/W/S or T/Th/S)
   - Time range
   - Teacher age-group specialty
2. Select desired schedule
3. Provide reason for change (text)
4. Submit request

Status tracking: Parent can see pending/approved/denied requests.

### `/parents/my-requests`
**Parent's request history**. List of:
- Make-up requests (with status)
- Schedule change requests (with status)

---

## Route Table (Summary)

| Path | Role(s) | Type | Description |
|------|---------|------|-------------|
| `/login` | all | page | Sign-in (Google SSO for staff, email for parents) |
| `/my-profile` | all | page | Personal profile & preferences |
| `/bulletin` | all (admin create) | page (+modal) | Announcements feed with attachments |
| `/users` | admin | page (+modal) | Manage users; invite modal |
| `/users/invite?role=…` | admin | modal | Invite new user by role |
| `/locations` | admin | page | Map + list with green/red pins |
| `/locations/new` | admin | page | Create location (type, geo, zoom link) |
| `/locations/:siteId` | admin | page | Location overview; who's here now/next |
| `/locations/:siteId/edit` | admin | page | Edit location metadata |
| `/teachers/new` | admin | page | Create teacher with specialty |
| `/teachers/:id` | admin | page | Teacher detail; edit schedules via wizard |
| `/teachers/:id/schedules/new` | admin | wizard | Create/append teacher schedules |
| `/students` | admin | page | Student list with search and filters |
| `/students/new` | admin | page | Create student (single location, school) |
| `/students/:id` | admin | page (+modals) | Student detail; link teachers/parents; documents; siblings |
| `/students/:id/link-teacher` | admin | modal | Add/remove teacher assignments |
| `/students/:id/link-parent` | admin | modal | Add/remove parent assignments |
| `/students/:id/upload?type=…` | admin | modal | Upload documents (audiogram/IEP/test results) |
| `/students/:id/siblings/new` | admin | modal | Add sibling info |
| `/admin/makeup-requests` | admin | page | Approve/deny make-up requests |
| `/admin/schedule-change-requests` | admin | page | Approve/deny schedule changes |
| `/teachers` | teacher | redirect | Redirects to `/my-day` |
| `/my-day` | teacher | page | Today's sessions; mark attendance with reasons |
| `/teachers/students/:id` | teacher | page | Student detail (teacher scope) with assessments |
| `/teachers/students/:id/note-new` | teacher | modal | Add quick session note |
| `/teachers/students/:id/assessment-new` | teacher | modal | Add pre/post assessment |
| `/teachers/makeup-sessions` | teacher | page | View/manage assigned make-up sessions |
| `/parents` | parent | redirect | Redirects to `/my-students` |
| `/my-students` | parent | page | Parent's linked children list |
| `/parents/children/:studentId` | parent | page | Child detail with request actions |
| `/parents/children/:studentId/makeup-request` | parent | modal | Request make-up for missed session |
| `/parents/schedule-change` | parent | page | Browse schedules & request change |
| `/parents/my-requests` | parent | page | View request history & status |

---

## Guardrails (Enforced)

- **Attendance** is marked on **`/my-day`** (teachers) with required reason for absences
- **Schedules:** Created/edited **only** by Admin; teachers have read-only views
- **Student Location:** Exactly **one** location per student (admin-enforced)
- **Teacher Multiple Schedules:** Allowed; managed by Admin
- **Documents:** Admin uploads audiograms/IEPs; system tracks due dates
- **Assessments:** Teachers record pre/post scores every 10-week cycle
- **Make-up Requests:** Parents request, admins approve, teachers host
- **Schedule Changes:** Parents browse/request, admins approve
- **Authorization:** Least-privilege; parents see only linked children; teachers see only assigned students
- **Email Notifications:**
  - Missed session alerts → site admin (immediate)
  - Birthday notifications → admin/teacher (1 week before)
  - Audiogram due reminders → admin (when approaching due date)

---

## Notes & Future (Out of Scope for v0)

The following are **deferred** to future versions:

- **Timecards** - Teacher clock-in/clock-out management
- **Teacher Contract Tracking** - Signed contract status
- **Reports/Exports** - Data export to CSV/PDF
- **Messaging** - In-app messaging between users
- **Offline Mode** - PWA offline access for remote sites
- **Media Galleries** - Photo/video uploads for graduations
- **Spanish Translation** - i18n support
- **Real-time Dashboards** - Live analytics and PowerBI integration
- **Parent Initial Schedule Selection** - Parents browse schedules at enrollment (using hybrid approach with change requests instead)
