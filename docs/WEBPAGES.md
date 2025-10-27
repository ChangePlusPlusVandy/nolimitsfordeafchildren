
# No Limits — v0 Routes & Pages

**Version:** v0 (media uploads removed; no assessments, reports, timecards, or makeup flow)  
**Scope:** Admin + Teacher + Parent (read‑only)  
**Time/Zone:** Store timestamps in **UTC**; render per user locale (e.g., PST for LA)  
**PII:** Lists show **student initials**; full PII only on authorized detail pages

---

## Conventions

- **Roles:** `administrator`, `teacher`, `parent`
- **IDs:** UUIDs in paths → `:siteId`, `:teacherId`, `:studentId`
- **Location Types:** `education_center` | `pop_up`
- **Modality:** heavy create/edit flows are **pages**; quick actions are **modal routes** (drawers/dialogs) with their own URLs
- **Map Pins:** **Green** = at least one active session **now** at site; **Red** = no sessions now (computed from schedules + attendance)
- **Student Location Rule:** each student belongs to **exactly one** location (enforced on admin Student page)
- **Teacher Schedules:** teachers can have **multiple schedules** (e.g., Saturday). **Admins edit; teachers read-only**

---

## Global (All Roles)

### `/login`
**Sign-in**. Google SSO for staff; email/MFA for parents.

### `/my-profile`
**Profile & preferences**. Update name, email, phone, locale; parents can change password/MFA.

### `/bulletin`
**Announcements**. Role/site-filtered feed.  
**Admin** can create bulletins via modal.

---

## Administrator

### `/users`
**User management** (admins, teachers, parents).  
Actions: invite (modal), enable/disable, change role, assign sites.

### `/locations`
**Map + list** of locations with live status.  
Actions: open location, **create** location (page).  
Pin logic: **Green** (someone on site now), **Red** (no one on site).

### `/locations/new` _(page)_
**Create location**. Fields: name, address/geo, **type** (`education_center` or `pop_up`), timezone, coordinators.

### `/locations/:siteId`
**Location overview**. Sections: Who’s here **now/next**, teacher roster, student roster.  
Links: teacher detail, student detail, edit location.

### `/locations/:siteId/edit` _(page)_
**Edit location** metadata (address/geo, type, timezone, coordinators).

### `/teachers/new` _(page)_
**Create teacher**. Fields: name, email, sites, specialties, (photo/CV optional in future).

### `/teachers/:id`
**Teacher detail (admin view)**.  
Actions: edit bio/photo/qualifications/credentials, upload CV (optional), view assigned students, **edit schedules** (wizard).

### `/teachers/:id/schedules/new` _(wizard page)_
**Create/append schedules** for a teacher (M/W/S or T/Th/S; add Saturday).  
Features: conflict check, review & create. **Admin-only.**

### `/students/new` _(page)_
**Create student** with **single location** (required), initials, DOB, guardians; optional teacher linking.

### `/students/:id`
**Student detail (admin view)**.  
Includes: full PII, **single location** (enforced), linked teachers (multiple allowed), attendance summary.  
Quick actions: link teacher (modal), upload **documents** (modal).

### `/students/:id/link-teacher` _(modal route / drawer)_
**Add/remove teacher assignments** for student.

### `/students/:id/upload?type=audiogram|iep` _(modal)_
**Admin uploads PDFs** (Audiogram/IEP). For audiogram, set date → compute next-due.

### `/users/invite?role=teacher|parent|admin` _(modal)_
**Invite user**. Fields: email, role, default site assignments.

---

## Teachers

### `/teachers` → redirects to `/my-day`
Convenience route.

### `/my-day`
**Primary teacher workspace**. Today’s sessions with inline **attendance** (Present / No‑Show / Cancelled).  
UI: time‑slot list, sticky “X of Y marked” footer, undo snackbar. Tap to student detail.

### `/teachers/students/:id`
**Student detail (teacher-scoped)**. Read‑only schedule, attendance summary, add **quick note** (modal).  
(No schedule edit; no uploads.)

### `/teachers/students/:id/note-new` _(modal)_
**Add quick session note** (short text).

---

## Parents

### `/parents` → redirects to `/my-students`
Convenience route.

### `/my-students`
**Linked children list**. Cards: initials, next session time, attendance/progress chip. Tap into child.

### `/parents/children/:studentId`
**Child detail (read-only)**. Weekly schedule, attendance summary, relevant bulletins.  
(No uploads; parents do not upload audiograms/IEPs or media in v0.)

---

## Route Table (Summary)

| Path | Role(s) | Type | Description |
|---|---|---|---|
| `/login` | all | page | Sign-in (Google SSO for staff, email for parents) |
| `/my-profile` | all | page | Personal profile & preferences |
| `/bulletin` | all (admin create) | page (+modal) | Announcements feed; admin can create via modal |
| `/users` | admin | page (+modal) | Manage users; invite modal |
| `/users/invite?role=…` | admin | modal | Invite new user by role |
| `/locations` | admin | page | Map + list with green/red pins |
| `/locations/new` | admin | page | Create location (type, geo, tz) |
| `/locations/:siteId` | admin | page | Location overview; who’s here now/next |
| `/locations/:siteId/edit` | admin | page | Edit location metadata |
| `/teachers/new` | admin | page | Create teacher |
| `/teachers/:id` | admin | page | Teacher detail; edit schedules via wizard |
| `/teachers/:id/schedules/new` | admin | page (wizard) | Create/append teacher schedules |
| `/students/new` | admin | page | Create student (single location) |
| `/students/:id` | admin | page (+modals) | Student detail; link teachers; upload documents |
| `/students/:id/link-teacher` | admin | modal | Add/remove teacher assignments |
| `/students/:id/upload?type=audiogram|iep` | admin | modal | Upload PDFs (Audiogram/IEP) |
| `/teachers` | teacher | redirect | Redirects to `/my-day` |
| `/my-day` | teacher | page | Today’s sessions; mark attendance |
| `/teachers/students/:id` | teacher | page | Student detail (teacher scope) |
| `/teachers/students/:id/note-new` | teacher | modal | Add quick session note |
| `/parents` | parent | redirect | Redirects to `/my-students` |
| `/my-students` | parent | page | Parent’s linked children list |
| `/parents/children/:studentId` | parent | page | Child detail (read-only) |

---

## Guardrails (Enforced)

- **Attendance** is primarily on **`/my-day`** (teachers).  
- **Schedules:** created/edited **only** by Admin at `/teachers/:id/schedules/new`; teachers have read-only schedule views.  
- **Student Location:** exactly **one** location per student (editable on admin Student page).  
- **Teacher Multiple Schedules:** allowed; managed by Admin.  
- **Uploads:** no teacher/parent uploads in v0; only admin uploads **documents** from `/students/:id/upload`.  
- **Authorization:** least-privilege; parents see only their linked children; teachers see only assigned students.  
- **Audit:** sensitive reads/exports are logged (future backend implementation detail).

---

## Notes & Future (Out of Scope for v0)

- Assessments, reports/exports, timecards, make‑up requests, messaging, offline mode, and media galleries are **deferred**.  
- Parent self-serve linking is deferred; Admin assigns parents ↔ students.
