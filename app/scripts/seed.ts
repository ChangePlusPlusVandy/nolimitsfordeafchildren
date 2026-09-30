/**
 * Deterministic local-dev seed (script, NOT part of the app).
 *
 * Usage:
 *   pnpm db:seed        (runs: tsx scripts/seed.ts)
 *
 * Wipes all tables in the LOCAL wrangler-emulated D1 and reseeds a known
 * dataset. Uses wrangler's `getPlatformProxy()` so it operates on the exact
 * same local D1/R2 state (.wrangler/state/v3) that `next dev` uses — the dev
 * server does not need to be running.
 *
 * Seeded dataset:
 *   - users: admin@nolimits.test (administrator), teacher@nolimits.test
 *     (teacher), parent@nolimits.test (parent, 2 linked children),
 *     stranger@nolimits.test (parent, NO linked children),
 *     pending@nolimits.test (unassigned),
 *     michelle + jeannette on both nolimitsfordeafchildren.org and
 *     kidswithnolimits.org (administrator, one account per domain)
 *   - 3 locations, 4 students (linked/unlinked/unassigned mixes)
 *   - a 10-week teaching cycle with schedules that include TODAY (so the
 *     teacher's "My Day" shows sessions), past attendance (present + no_show),
 *     session notes, pre-assessments and audiogram documents (+ R2 objects)
 *     with due dates inside/outside the 30-day reminder window
 *
 * Secrets: all passwords are the same deterministic test password. The
 * *.nolimits.test accounts are fake. Michelle and Jeannette are local
 * administrator logins (one per org domain). Never real student data.
 * Safe to run repeatedly (fully deterministic re-seed).
 */

import { eq } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";

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
import { db, initD1, setDb } from "@/lib/db";
import { addDaysStr, dayOfWeek, todayStr } from "@/server/shared/dates";

const SEED_PASSWORD = "NoLimits!2026";

/** Staff logins, one account per organization email domain. */
const STAFF_SEED_USERS = [
  { name: "Michelle", localPart: "michelle" },
  { name: "Jeannette", localPart: "jeannette" },
] as const;
const STAFF_EMAIL_DOMAINS = ["nolimitsfordeafchildren.org", "kidswithnolimits.org"] as const;
const staffSeedAccounts = STAFF_SEED_USERS.flatMap((person) =>
  STAFF_EMAIL_DOMAINS.map((domain) => ({
    email: `${person.localPart}@${domain}`,
    name: person.name,
  })),
);

const SEED_EMAILS = [
  "admin@nolimits.test",
  "teacher@nolimits.test",
  "parent@nolimits.test",
  "stranger@nolimits.test",
  "pending@nolimits.test",
  ...staffSeedAccounts.map((account) => account.email),
];

const seedNameByEmail = new Map(staffSeedAccounts.map((account) => [account.email, account.name]));

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
async function wipeAllTables(d1: D1Database): Promise<void> {
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
    await d1.exec(`DELETE FROM ${table}`);
  }
}

/** Bitmask of weekday bits (Sun=1 … Sat=64) for org-calendar date-only strings. */
function maskForDateStrs(dates: string[]): number {
  return dates.reduce((mask, date) => mask | (1 << dayOfWeek(date)), 0);
}

function noonUtc(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

async function seed(d1: D1Database, bucket: R2Bucket): Promise<void> {
  await initD1(d1);
  await wipeAllTables(d1);

  // ----- users (via better-auth so password hashing matches production) -----
  const auth = getAuth();
  for (const email of SEED_EMAILS) {
    await auth.api.signUpEmail({
      body: {
        email,
        password: SEED_PASSWORD,
        name: seedNameByEmail.get(email) ?? email.split("@")[0] ?? email,
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

  // Keep the summary map in sync with the role updates above.
  users.set("teacher@nolimits.test", { ...teacherUser, role: "teacher" });
  users.set("parent@nolimits.test", { ...parentUser, role: "parent" });
  users.set("stranger@nolimits.test", { ...strangerUser, role: "parent" });

  for (const account of staffSeedAccounts) {
    const user = getSeededUser(account.email);
    await db
      .update(UserTable)
      .set({ role: "administrator", updated_at: new Date() })
      .where(eq(UserTable.id, user.id));
    users.set(account.email, { ...user, role: "administrator" });
  }

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
  // Use the same America/Los_Angeles calendar as My Day (not UTC).
  const today = todayStr();
  const cycleStart = addDaysStr(today, -7);
  const cycleEnd = addDaysStr(today, 63);
  const [cycleSession] = await db
    .insert(SessionTable)
    .values({
      name: "Fall 2026 Seed Cycle",
      start_date: cycleStart,
      end_date: cycleEnd,
    })
    .returning();

  // Schedule days: today, today+2, today+4 (always includes TODAY in org TZ).
  const mask = maskForDateStrs([today, addDaysStr(today, 2), addDaysStr(today, 4)]);
  const [centerSchedule] = await db
    .insert(ScheduleTable)
    .values({
      teacher_id: teacherProfile.id,
      site_id: center.id,
      session_id: cycleSession.id,
      day_of_week_mask: mask,
      start_time: "09:00",
      end_time: "10:00",
      cycle_start_date: cycleStart,
      cycle_end_date: cycleEnd,
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
      cycle_start_date: cycleStart,
      cycle_end_date: cycleEnd,
    })
    .returning();

  await db.insert(EnrollmentTable).values([
    { student_id: mia.id, schedule_id: centerSchedule.id },
    { student_id: leo.id, schedule_id: centerSchedule.id },
    { student_id: ava.id, schedule_id: popupSchedule.id },
  ]);

  // ----- past attendance (same weekday as today, in the cycle) -----
  const pastDate = addDaysStr(today, -7);
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
      cycle_start_date: cycleStart,
      assessment_type: "pre",
      teaching_focus: "Speech articulation",
      summary: "Baseline for Fall 2026 cycle.",
      score: 14,
      assessed_at: noonUtc(cycleStart),
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
      cycle_start_date: cycleStart,
      assessment_type: "pre",
      teaching_focus: "Auditory discrimination",
      summary: "Baseline for Fall 2026 cycle.",
      score: 12,
      assessed_at: noonUtc(cycleStart),
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
  const miaDue = addDaysStr(today, 25); // inside the 30-day reminder window
  const leoDue = addDaysStr(today, -17); // overdue
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
      document_date: addDaysStr(today, -158),
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
      document_date: addDaysStr(today, -200),
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

  console.log("[seed] reseeded:", JSON.stringify(summary, null, 2));
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed: refusing to run with NODE_ENV=production");
  }

  // Deterministic env for better-auth (matches .dev.vars defaults). The
  // bootstrap list is what grants admin@nolimits.test the administrator role.
  process.env.BOOTSTRAP_ADMIN_EMAILS ??= "admin@nolimits.test";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.CORS_ORIGINS ??= "http://localhost:3000";

  // Same local persistence (.wrangler/state/v3) as `next dev` / `wrangler dev`.
  const proxy = await getPlatformProxy<{ DB: D1Database; BUCKET: R2Bucket }>({
    configPath: "wrangler.jsonc",
    persist: true,
  });

  try {
    setDb(proxy.env.DB);
    await seed(proxy.env.DB, proxy.env.BUCKET);
  } finally {
    await proxy.dispose();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  },
);
