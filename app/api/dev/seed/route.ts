/**
 * DEV-ONLY deterministic seed for local testing.
 *
 * POST /api/dev/seed  — wipes all tables and reseeds a known dataset:
 *   - users: admin@nolimits.test (administrator), teacher@nolimits.test (teacher),
 *     parent@nolimits.test (parent, 2 linked children), stranger@nolimits.test
 *     (parent, NO linked children), pending@nolimits.test (unassigned)
 *   - 3 locations, 4 students (linked/unlinked/unassigned mixes)
 *   - a 10-week teaching cycle with schedules that include TODAY (so the
 *     teacher's "My Day" shows sessions), past attendance (present + no_show),
 *     session notes, pre-assessments and audiogram documents (+ R2 objects)
 *     with due dates inside/outside the 30-day reminder window
 *
 * Secrets: all passwords are the same deterministic test password; users are
 * FAKE (nolimits.test domain) — never real student data.
 *
 * The route is disabled unless `ENABLE_DEV_SEED=true` is set in `.dev.vars`
 * (gitignored, local dev only) and NODE_ENV is not production. It is safe to
 * call repeatedly (fully deterministic re-seed).
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  AssessmentFocusTable,
  AssessmentTable,
  AttendanceTable,
  DocumentTable,
  EnrollmentTable,
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  ScheduleTable,
  SessionNoteTable,
  SessionTable,
  SiblingTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

const SEED_PASSWORD = "NoLimits!2026";
const SEED_EMAILS = [
  "admin@nolimits.test",
  "teacher@nolimits.test",
  "parent@nolimits.test",
  "stranger@nolimits.test",
  "pending@nolimits.test",
];

const AUDIOGRAM_CONTENT = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT /F1 12 Tf 72 720 Td (Seed audiogram - not a real medical record) Tj ET
endstream
endobj
trailer<</Root 1 0 R>>
%%EOF
`;

/** Full-table wipe in FK-safe dependency order (children first). */
async function wipeAllTables(): Promise<void> {
  const tables = [
    "attendance_sibling_participants",
    "attendance",
    "session_notes",
    "assessment_focuses",
    "assessments",
    "documents",
    "photos",
    "makeup_sessions",
    "makeup_requests",
    "schedule_change_request_events",
    "schedule_change_requests",
    "bulletin_acknowledgements",
    "bulletin_views",
    "bulletin_attachments",
    "bulletins",
    "chat_messages",
    "teacher_sick_day_notices",
    "enrollments",
    "schedules",
    "siblings",
    "teacher_student",
    "parent_student_link",
    "teacher_locations",
    "students",
    "teacher_profiles",
    "parent_profiles",
    "sessions",
    "locations",
    "users",
    "auth_verifications",
    "auth_accounts",
    "auth_sessions",
    "auth_users",
  ] as const;

  for (const table of tables) {
    await (db.$client as D1Database).exec(`DELETE FROM ${table}`);
  }
}

function getEnvValue(key: string): string | undefined {
  try {
    const env = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    const value = env[key];
    if (value !== undefined && value !== "") return value;
  } catch {
    // no request context
  }
  return process.env[key];
}

function isSeedEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return getEnvValue("ENABLE_DEV_SEED") === "true";
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Bitmask of weekday bits (Sun=1 … Sat=64) for the given dates. */
function maskForDates(dates: Date[]): number {
  return dates.reduce((mask, date) => mask | (1 << date.getUTCDay()), 0);
}

export async function POST() {
  if (!isSeedEnabled()) {
    return NextResponse.json(
      { error: "Dev seed disabled: set ENABLE_DEV_SEED=true in .dev.vars (local only)" },
      { status: 404 },
    );
  }

  const bucket = getCloudflareContext().env.BUCKET;
  if (!bucket) {
    return NextResponse.json({ error: "BUCKET binding missing" }, { status: 500 });
  }

  await wipeAllTables();

  // ----- users (via better-auth so password hashing matches production) -----
  const auth = getAuth();
  for (const email of SEED_EMAILS) {
    await auth.api.signUpEmail({
      body: {
        email,
        password: SEED_PASSWORD,
        name: email.split("@")[0] ?? email,
      },
    });
  }

  const users = new Map<string, { id: string; name: string; email: string; role: string }>();
  for (const email of SEED_EMAILS) {
    const [row] = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        role: UserTable.role,
      })
      .from(UserTable)
      .where(eq(UserTable.email, email))
      .limit(1);
    if (!row) throw new Error(`seed: app user missing for ${email}`);
    users.set(email, row);
  }

  // admin is granted by BOOTSTRAP_ADMIN_EMAILS on signup; fix the rest.
  const getSeededUser = (email: string) => {
    const user = users.get(email);
    if (!user) throw new Error(`seed: missing seeded user ${email}`);
    return user;
  };
  const teacherUser = getSeededUser("teacher@nolimits.test");
  const parentUser = getSeededUser("parent@nolimits.test");
  const strangerUser = getSeededUser("stranger@nolimits.test");
  const adminUser = getSeededUser("admin@nolimits.test");

  await db
    .update(UserTable)
    .set({ role: "teacher", updated_at: new Date() })
    .where(eq(UserTable.id, teacherUser.id));
  await db
    .update(UserTable)
    .set({ role: "parent", updated_at: new Date() })
    .where(eq(UserTable.id, parentUser.id));
  await db
    .update(UserTable)
    .set({ role: "parent", updated_at: new Date() })
    .where(eq(UserTable.id, strangerUser.id));

  const [teacherProfile] = await db
    .insert(TeacherProfileTable)
    .values({ user_id: teacherUser.id, age_group_specialty: "all_ages" })
    .returning();
  const [parentProfile] = await db
    .insert(ParentProfileTable)
    .values({ user_id: parentUser.id, preferred_contact_method: "email" })
    .returning();
  await db.insert(ParentProfileTable).values({ user_id: strangerUser.id });

  // ----- locations -----
  const [center] = await db
    .insert(LocationTable)
    .values({
      name: "Main Education Center",
      type: "education_center",
      address_line1: "1410 Oak Street",
      city: "Sacramento",
      state: "CA",
      postal_code: "95814",
    })
    .returning();
  const [popup] = await db
    .insert(LocationTable)
    .values({
      name: "Harbor Pop-Up Library",
      type: "pop_up",
      address_line1: "500 Harbor Blvd",
      city: "West Sacramento",
      state: "CA",
      postal_code: "95691",
    })
    .returning();
  const [remote] = await db
    .insert(LocationTable)
    .values({
      name: "Rosewood Remote",
      type: "remote",
      address_line1: "Remote",
      city: "Sacramento",
      state: "CA",
      postal_code: "95814",
    })
    .returning();

  await db
    .update(TeacherProfileTable)
    .set({ primary_site_id: center.id })
    .where(eq(TeacherProfileTable.id, teacherProfile.id));
  await db.insert(TeacherLocationTable).values([
    { teacher_profile_id: teacherProfile.id, location_id: center.id },
    { teacher_profile_id: teacherProfile.id, location_id: popup.id },
  ]);

  // ----- students -----
  const [mia] = await db
    .insert(StudentTable)
    .values({
      site_id: center.id,
      first_name: "Mia",
      last_name: "Chen",
      initials: "MC",
      dob: "2016-04-10",
      hearing_loss_type: "moderate",
      current_school: "Lincoln Elementary",
      preferred_language: "English",
      guardian_summary: "Seed data; not a real student.",
    })
    .returning();
  const [leo] = await db
    .insert(StudentTable)
    .values({
      site_id: center.id,
      first_name: "Leo",
      last_name: "Nguyen",
      initials: "LN",
      dob: "2018-11-02",
      hearing_loss_type: "severe",
      current_school: "Turtle Creek Elementary",
      guardian_summary: "Seed data; not a real student.",
    })
    .returning();
  const [ava] = await db
    .insert(StudentTable)
    .values({
      site_id: popup.id,
      first_name: "Ava",
      last_name: "Park",
      initials: "AP",
      dob: "2015-07-19",
      hearing_loss_type: "mild",
      current_school: "Riverview Middle",
      guardian_summary: "Seed data; not a real student.",
    })
    .returning();
  const [noah] = await db
    .insert(StudentTable)
    .values({
      site_id: remote.id,
      first_name: "Noah",
      last_name: "Reyes",
      initials: "NR",
      dob: "2017-01-25",
      hearing_loss_type: "unknown",
      current_school: "Capitol Elementary",
      guardian_summary: "Seed data; not a real student.",
    })
    .returning();

  // One sibling on Mia (exercises the sibling-participant UI).
  await db.insert(SiblingTable).values({
    student_id: mia.id,
    name: "Emma Chen",
    age: 8,
    relationship: "sister",
    is_participant: true,
    has_hearing_loss: false,
  });

  // ----- links -----
  await db.insert(TeacherStudentTable).values([
    { teacher_id: teacherProfile.id, student_id: mia.id },
    { teacher_id: teacherProfile.id, student_id: leo.id },
    { teacher_id: teacherProfile.id, student_id: ava.id },
  ]);
  await db.insert(ParentStudentLinkTable).values([
    { parent_id: parentProfile.id, student_id: mia.id, relationship: "mother", is_primary: true },
    { parent_id: parentProfile.id, student_id: leo.id, relationship: "mother" },
  ]);
  // Noah is intentionally unlinked (no teacher, no parent).

  // ----- 10-week cycle including today, with today's weekday in the mask -----
  const today = new Date();
  const cycleStart = addDays(today, -7);
  const cycleEnd = addDays(today, 63);
  const [cycleSession] = await db
    .insert(SessionTable)
    .values({
      name: "Fall 2026 Seed Cycle",
      start_date: toDateStr(cycleStart),
      end_date: toDateStr(cycleEnd),
    })
    .returning();

  // Schedule days: today, today+2, today+4 (always includes TODAY).
  const mask = maskForDates([today, addDays(today, 2), addDays(today, 4)]);
  const [centerSchedule] = await db
    .insert(ScheduleTable)
    .values({
      teacher_id: teacherProfile.id,
      site_id: center.id,
      session_id: cycleSession.id,
      day_of_week_mask: mask,
      start_time: "09:00",
      end_time: "10:00",
      cycle_start_date: toDateStr(cycleStart),
      cycle_end_date: toDateStr(cycleEnd),
    })
    .returning();
  const [popupSchedule] = await db
    .insert(ScheduleTable)
    .values({
      teacher_id: teacherProfile.id,
      site_id: popup.id,
      session_id: cycleSession.id,
      day_of_week_mask: mask,
      start_time: "10:30",
      end_time: "11:30",
      cycle_start_date: toDateStr(cycleStart),
      cycle_end_date: toDateStr(cycleEnd),
    })
    .returning();

  await db.insert(EnrollmentTable).values([
    { student_id: mia.id, schedule_id: centerSchedule.id },
    { student_id: leo.id, schedule_id: centerSchedule.id },
    { student_id: ava.id, schedule_id: popupSchedule.id },
  ]);

  // ----- past attendance (same weekday as today, in the cycle) -----
  const pastDate = toDateStr(addDays(today, -7));
  await db.insert(AttendanceTable).values([
    {
      student_id: mia.id,
      schedule_id: centerSchedule.id,
      session_date: pastDate,
      status: "present",
      marked_by: teacherUser.id,
    },
    {
      student_id: leo.id,
      schedule_id: centerSchedule.id,
      session_date: pastDate,
      status: "no_show",
      reason: "transportation",
      reason_text: null,
      marked_by: teacherUser.id,
    },
  ]);

  // ----- session note for Mia -----
  await db.insert(SessionNoteTable).values({
    student_id: mia.id,
    teacher_id: teacherProfile.id,
    schedule_id: centerSchedule.id,
    session_date: pastDate,
    note: "Seed note: practiced /s/ and /sh/ minimal pairs; excellent progress.",
  });

  // ----- pre-assessments -----
  const [miaPre] = await db
    .insert(AssessmentTable)
    .values({
      student_id: mia.id,
      teacher_id: teacherProfile.id,
      cycle_start_date: toDateStr(cycleStart),
      assessment_type: "pre",
      teaching_focus: "Speech articulation",
      summary: "Baseline for Fall 2026 cycle.",
      score: 14,
      assessed_at: cycleStart,
    })
    .returning();
  await db.insert(AssessmentFocusTable).values([
    { assessment_id: miaPre.id, goal: "Initial /s/", score: 7, max_score: 10, sort_order: 1 },
    { assessment_id: miaPre.id, goal: "Initial /sh/", score: 7, max_score: 10, sort_order: 2 },
  ]);
  const [leoPre] = await db
    .insert(AssessmentTable)
    .values({
      student_id: leo.id,
      teacher_id: teacherProfile.id,
      cycle_start_date: toDateStr(cycleStart),
      assessment_type: "pre",
      teaching_focus: "Auditory discrimination",
      summary: "Baseline for Fall 2026 cycle.",
      score: 12,
      assessed_at: cycleStart,
    })
    .returning();
  await db.insert(AssessmentFocusTable).values({
    assessment_id: leoPre.id,
    goal: "Minimal pairs discrimination",
    score: 12,
    max_score: 20,
    sort_order: 1,
  });

  // ----- audiogram documents + R2 objects (due soon / overdue) -----
  const miaDue = toDateStr(addDays(today, 25)); // inside the 30-day reminder window
  const leoDue = toDateStr(addDays(today, -17)); // overdue
  const miaKey = `documents/student/${mia.id}/audiogram/seed-audiogram.pdf`;
  const leoKey = `documents/student/${leo.id}/audiogram/seed-audiogram-overdue.pdf`;
  await bucket.put(miaKey, AUDIOGRAM_CONTENT, {
    httpMetadata: { contentType: "application/pdf" },
  });
  await bucket.put(leoKey, AUDIOGRAM_CONTENT, {
    httpMetadata: { contentType: "application/pdf" },
  });

  await db.insert(DocumentTable).values([
    {
      entity_type: "student",
      entity_id: mia.id,
      document_type: "audiogram",
      file_url: `/api/files/${miaKey}`,
      file_name: "seed-audiogram.pdf",
      file_size: new TextEncoder().encode(AUDIOGRAM_CONTENT).length,
      mime_type: "application/pdf",
      document_date: toDateStr(addDays(today, -158)),
      next_due_date: miaDue,
      review_status: "approved",
      uploaded_by: adminUser.id,
    },
    {
      entity_type: "student",
      entity_id: leo.id,
      document_type: "audiogram",
      file_url: `/api/files/${leoKey}`,
      file_name: "seed-audiogram-overdue.pdf",
      file_size: new TextEncoder().encode(AUDIOGRAM_CONTENT).length,
      mime_type: "application/pdf",
      document_date: toDateStr(addDays(today, -200)),
      next_due_date: leoDue,
      review_status: "approved",
      uploaded_by: adminUser.id,
    },
  ]);

  const summary = {
    password: SEED_PASSWORD,
    users: Object.fromEntries(
      [...users.entries()].map(([email, u]) => [email, { id: u.id, role: u.role }]),
    ),
    teacher_profile_id: teacherProfile.id,
    parent_profile_id: parentProfile.id,
    locations: { center: center.id, popup: popup.id, remote: remote.id },
    students: { mia: mia.id, leo: leo.id, ava: ava.id, noah: noah.id },
    schedules: { center: centerSchedule.id, popup: popupSchedule.id },
    attendance: { past_session_date: pastDate },
    documents: { mia_audiogram: `/api/files/${miaKey}`, leo_audiogram: `/api/files/${leoKey}` },
    due_dates: { mia_next_due: miaDue, leo_next_due: leoDue },
  };

  console.log("[Dev Seed] reseeded:", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export async function GET() {
  if (!isSeedEnabled()) {
    return NextResponse.json({ error: "Dev seed disabled" }, { status: 404 });
  }
  return NextResponse.json({
    message: "POST /api/dev/seed to (re)seed. Seed users use the nolimits.test domain.",
    emails: SEED_EMAILS,
  });
}
