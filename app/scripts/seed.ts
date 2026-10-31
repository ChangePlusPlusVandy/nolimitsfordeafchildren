/**
 * Deterministic local-dev seed (script, NOT part of the app).
 *
 * Usage:
 *   pnpm db:seed        (runs: tsx scripts/seed.ts)
 *
 * Wipes all tables in the LOCAL wrangler-emulated D1 and reseeds a known
 * dataset. Uses wrangler's `getPlatformProxy()` so it operates on the exact
 * same local D1/R2 state (.wrangler/state/v3) that `vite dev` uses — the dev
 * server does not need to be running.
 *
 * Seeded dataset:
 *   - users: admin@nolimits.test (administrator), teacher@nolimits.test
 *     (teacher), parent@nolimits.test (parent, 2 linked children),
 *     stranger@nolimits.test (parent, NO linked children),
 *     pending@nolimits.test (unassigned),
 *     michelle + jeannette on both nolimitsfordeafchildren.org and
 *     kidswithnolimits.org (administrator, one account per domain)
 *   - 3 locations, 5 students (linked/unlinked/unassigned mixes; Owen shares
 *     Mia's site without a parent link)
 *   - a 10-week teaching cycle with schedules that include TODAY (so the
 *     teacher's "My Day" shows sessions), past attendance (present + no_show),
 *     session notes, pre-assessments and audiogram documents (+ R2 objects)
 *     with due dates inside/outside the 30-day reminder window
 *   - a pending pre-report for Mia (staff see it; her parent only once approved)
 *   - photos (+ R2 objects) for each file-access case: group and per-student
 *     photos at the center, Ava at the pop-up, and a Rosewood group photo
 *   - bulletins with attachments (+ R2 objects): approved global, pending
 *     global, and approved Rosewood-only
 *
 * Secrets: all passwords are the same deterministic test password. The
 * *.nolimits.test accounts are fake. Michelle and Jeannette are local
 * administrator logins (one per org domain). Never real student data.
 * Safe to run repeatedly (fully deterministic re-seed).
 */

import { eq, inArray } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { getPlatformProxy } from "wrangler";

import { getAuth } from "@/_platform/auth/server";
import { db, initD1, setDb } from "@/_platform/db";
import {
  AssessmentFocusTable,
  AssessmentTable,
  AttendanceTable,
  BulletinAttachmentTable,
  BulletinTable,
  DocumentTable,
  EnrollmentTable,
  LocationTable,
  ParentProfileTable,
  ParentStudentLinkTable,
  PhotoTable,
  ScheduleTable,
  SessionNoteTable,
  SessionTable,
  SiblingTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherStudentTable,
  type UserRole,
  UserTable,
} from "@/_platform/db/schema";
import { addDaysStr, dayOfWeek, todayStr } from "@/_shared/server/dates";

const SEED_PASSWORD = "NoLimits!2026";
const AUDIOGRAM_MIME_TYPE = "application/pdf";
const SEED_GUARDIAN_SUMMARY = "Seed data; not a real student.";

type SeedUser = { email: string; name: string; role?: UserRole };

/** Staff logins, one account per organization email domain. */
const STAFF_SEED_USERS = [
  { name: "Michelle", localPart: "michelle" },
  { name: "Jeannette", localPart: "jeannette" },
] as const;
const STAFF_EMAIL_DOMAINS = ["nolimitsfordeafchildren.org", "kidswithnolimits.org"] as const;
const SEED_USERS: SeedUser[] = [
  { email: "admin@nolimits.test", name: "admin" },
  { email: "teacher@nolimits.test", name: "teacher", role: "teacher" },
  { email: "parent@nolimits.test", name: "parent", role: "parent" },
  { email: "stranger@nolimits.test", name: "stranger", role: "parent" },
  { email: "pending@nolimits.test", name: "pending" },
  ...STAFF_SEED_USERS.flatMap((person) =>
    STAFF_EMAIL_DOMAINS.map((domain) => ({
      email: `${person.localPart}@${domain}`,
      name: person.name,
      role: "administrator" as const,
    })),
  ),
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
const AUDIOGRAM_SIZE = new TextEncoder().encode(AUDIOGRAM_CONTENT).length;

// 1x1 transparent PNG; seed photos only need a real image body.
const PHOTO_MIME_TYPE = "image/png";
const PHOTO_CONTENT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
const BULLETIN_ATTACHMENT_MIME_TYPE = "text/plain";

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

  await d1.batch(tables.map((table) => d1.prepare(`DELETE FROM ${table}`)));
}

function setRole(role: UserRole) {
  const emails = SEED_USERS.filter((user) => user.role === role).map((user) => user.email);
  return db
    .update(UserTable)
    .set({ role, updated_at: new Date() })
    .where(inArray(UserTable.email, emails));
}

async function insertReturning<T extends SQLiteTable>(
  table: T,
  values: T["$inferInsert"][],
  key: keyof T["$inferInsert"] & keyof T["$inferSelect"],
): Promise<T["$inferSelect"][]> {
  const rows: T["$inferSelect"][] = await db.insert(table).values(values).returning();

  // Match a unique seed field because SQLite RETURNING does not guarantee order.
  return values.map((value) => {
    const row = rows.find((candidate) => candidate[key] === value[key]);
    if (!row) {
      throw new Error(`seed: inserted row missing for ${String(value[key])}`);
    }
    return row;
  });
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
  for (const { email, name } of SEED_USERS) {
    await auth.api.signUpEmail({
      body: {
        email,
        password: SEED_PASSWORD,
        name,
      },
    });
  }

  // Leave bootstrap-only roles unchanged and read the final roles for the summary.
  await db.batch([setRole("teacher"), setRole("parent"), setRole("administrator")]);
  const userRows = await db
    .select({ id: UserTable.id, role: UserTable.role, email: UserTable.email })
    .from(UserTable);
  const usersByEmail = new Map(userRows.map((user) => [user.email, user]));
  const getSeededUser = (email: string) => {
    const user = usersByEmail.get(email);
    if (!user) {
      throw new Error(`seed: app user missing for ${email}`);
    }
    return user;
  };
  const users = new Map(SEED_USERS.map(({ email }) => [email, getSeededUser(email)]));
  const teacherUser = getSeededUser("teacher@nolimits.test");
  const parentUser = getSeededUser("parent@nolimits.test");
  const strangerUser = getSeededUser("stranger@nolimits.test");
  const adminUser = getSeededUser("admin@nolimits.test");

  const [teacherProfile] = await insertReturning(
    TeacherProfileTable,
    [{ user_id: teacherUser.id, age_group_specialty: "all_ages" }],
    "user_id",
  );
  const [parentProfile] = await insertReturning(
    ParentProfileTable,
    [{ user_id: parentUser.id, preferred_contact_method: "email" }, { user_id: strangerUser.id }],
    "user_id",
  );

  // ----- locations -----
  const [center, popup, remote] = await insertReturning(
    LocationTable,
    [
      {
        name: "Main Education Center",
        type: "education_center",
        address_line1: "1410 Oak Street",
        city: "Sacramento",
        state: "CA",
        postal_code: "95814",
      },
      {
        name: "Harbor Pop-Up Library",
        type: "pop_up",
        address_line1: "500 Harbor Blvd",
        city: "West Sacramento",
        state: "CA",
        postal_code: "95691",
      },
      {
        name: "Rosewood Remote",
        type: "remote",
        address_line1: "Remote",
        city: "Sacramento",
        state: "CA",
        postal_code: "95814",
      },
    ],
    "type",
  );

  await db
    .update(TeacherProfileTable)
    .set({ primary_site_id: center.id })
    .where(eq(TeacherProfileTable.id, teacherProfile.id));
  await db.insert(TeacherLocationTable).values([
    { teacher_profile_id: teacherProfile.id, location_id: center.id },
    { teacher_profile_id: teacherProfile.id, location_id: popup.id },
  ]);

  // ----- students -----
  const [mia, leo, ava, noah, owen] = await insertReturning(
    StudentTable,
    (
      [
        {
          site_id: center.id,
          first_name: "Mia",
          last_name: "Chen",
          initials: "MC",
          dob: "2016-04-10",
          hearing_loss_type: "moderate",
          current_school: "Lincoln Elementary",
          preferred_language: "English",
        },
        {
          site_id: center.id,
          first_name: "Leo",
          last_name: "Nguyen",
          initials: "LN",
          dob: "2018-11-02",
          hearing_loss_type: "severe",
          current_school: "Turtle Creek Elementary",
        },
        {
          site_id: popup.id,
          first_name: "Ava",
          last_name: "Park",
          initials: "AP",
          dob: "2015-07-19",
          hearing_loss_type: "mild",
          current_school: "Riverview Middle",
        },
        {
          site_id: remote.id,
          first_name: "Noah",
          last_name: "Reyes",
          initials: "NR",
          dob: "2017-01-25",
          hearing_loss_type: "unknown",
          current_school: "Capitol Elementary",
        },
        {
          site_id: center.id,
          first_name: "Owen",
          last_name: "Diaz",
          initials: "OD",
          dob: "2017-09-14",
          hearing_loss_type: "moderate",
          current_school: "Lincoln Elementary",
        },
      ] as const
    ).map((student) => ({ ...student, guardian_summary: SEED_GUARDIAN_SUMMARY })),
    "initials",
  );

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
    { teacher_id: teacherProfile.id, student_id: owen.id },
  ]);
  await db.insert(ParentStudentLinkTable).values([
    { parent_id: parentProfile.id, student_id: mia.id, relationship: "mother", is_primary: true },
    { parent_id: parentProfile.id, student_id: leo.id, relationship: "mother" },
  ]);
  // Noah is intentionally unlinked (no teacher, no parent).
  // Owen shares Mia's site but has no parent link (another family at the same site).

  // ----- 10-week cycle including today, with today's weekday in the mask -----
  // Use the same America/Los_Angeles calendar as My Day (not UTC).
  const today = todayStr();
  const cycleStart = addDaysStr(today, -7);
  const cycleEnd = addDaysStr(today, 63);
  const [cycleSession] = await insertReturning(
    SessionTable,
    [{ name: "Fall 2026 Seed Cycle", start_date: cycleStart, end_date: cycleEnd }],
    "name",
  );

  // Schedule days: today, today+2, today+4 (always includes TODAY in org TZ).
  const mask = maskForDateStrs([today, addDaysStr(today, 2), addDaysStr(today, 4)]);
  const [centerSchedule, popupSchedule] = await insertReturning(
    ScheduleTable,
    [
      { site_id: center.id, start_time: "09:00", end_time: "10:00" },
      { site_id: popup.id, start_time: "10:30", end_time: "11:30" },
    ].map((schedule) => ({
      ...schedule,
      teacher_id: teacherProfile.id,
      session_id: cycleSession.id,
      day_of_week_mask: mask,
      cycle_start_date: cycleStart,
      cycle_end_date: cycleEnd,
    })),
    "site_id",
  );

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
  const [miaPre, leoPre] = await insertReturning(
    AssessmentTable,
    [
      { student_id: mia.id, teaching_focus: "Speech articulation", score: 14 },
      { student_id: leo.id, teaching_focus: "Auditory discrimination", score: 12 },
    ].map((assessment) => ({
      ...assessment,
      teacher_id: teacherProfile.id,
      cycle_start_date: cycleStart,
      assessment_type: "pre" as const,
      summary: "Baseline for Fall 2026 cycle.",
      assessed_at: noonUtc(cycleStart),
    })),
    "student_id",
  );
  await db.insert(AssessmentFocusTable).values([
    { assessment_id: miaPre.id, goal: "Initial /s/", score: 7, max_score: 10, sort_order: 1 },
    { assessment_id: miaPre.id, goal: "Initial /sh/", score: 7, max_score: 10, sort_order: 2 },
    {
      assessment_id: leoPre.id,
      goal: "Minimal pairs discrimination",
      score: 12,
      max_score: 20,
      sort_order: 1,
    },
  ]);

  // ----- audiogram documents + R2 objects (due soon / overdue) -----
  const miaDue = addDaysStr(today, 25); // inside the 30-day reminder window
  const leoDue = addDaysStr(today, -17); // overdue
  const miaKey = `documents/student/${mia.id}/audiogram/seed-audiogram.pdf`;
  const leoKey = `documents/student/${leo.id}/audiogram/seed-audiogram-overdue.pdf`;
  for (const key of [miaKey, leoKey]) {
    await bucket.put(key, AUDIOGRAM_CONTENT, {
      httpMetadata: { contentType: AUDIOGRAM_MIME_TYPE },
    });
  }

  await db.insert(DocumentTable).values([
    {
      entity_type: "student",
      entity_id: mia.id,
      document_type: "audiogram",
      file_url: `/api/files/${miaKey}`,
      file_name: "seed-audiogram.pdf",
      file_size: AUDIOGRAM_SIZE,
      mime_type: AUDIOGRAM_MIME_TYPE,
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
      file_size: AUDIOGRAM_SIZE,
      mime_type: AUDIOGRAM_MIME_TYPE,
      document_date: addDaysStr(today, -200),
      next_due_date: leoDue,
      review_status: "approved",
      uploaded_by: adminUser.id,
    },
  ]);

  // ----- pending pre-report for Mia (staff can see it; her parent cannot yet) -----
  const preReportKey = `documents/student/${mia.id}/pre_report/seed-pre-report-pending.txt`;
  const preReportContent = "Seed pre-report draft; not a real report.";
  await bucket.put(preReportKey, preReportContent, {
    httpMetadata: { contentType: "text/plain" },
  });
  await db.insert(DocumentTable).values({
    entity_type: "student",
    entity_id: mia.id,
    document_type: "pre_report",
    file_url: `/api/files/${preReportKey}`,
    file_name: "seed-pre-report-pending.txt",
    file_size: new TextEncoder().encode(preReportContent).length,
    mime_type: "text/plain",
    review_status: "pending",
    uploaded_by: teacherUser.id,
  });

  // ----- photos + R2 objects (one per file-access case) -----
  const photos = [
    { name: "center-group", location: center, student: null, uploader: teacherUser },
    { name: "center-mia", location: center, student: mia, uploader: teacherUser },
    { name: "center-owen", location: center, student: owen, uploader: teacherUser },
    { name: "popup-ava", location: popup, student: ava, uploader: teacherUser },
    { name: "remote-group", location: remote, student: null, uploader: adminUser },
  ].map((photo) => ({
    ...photo,
    key: `photos/location/${photo.location.id}/${pastDate}/seed-${photo.name}.png`,
  }));
  for (const { key } of photos) {
    await bucket.put(key, PHOTO_CONTENT, { httpMetadata: { contentType: PHOTO_MIME_TYPE } });
  }
  await db.insert(PhotoTable).values(
    photos.map((photo) => ({
      location_id: photo.location.id,
      student_id: photo.student?.id ?? null,
      session_date: pastDate,
      caption: `Seed photo: ${photo.name}`,
      file_url: `/api/files/${photo.key}`,
      file_name: `seed-${photo.name}.png`,
      file_size: PHOTO_CONTENT.length,
      mime_type: PHOTO_MIME_TYPE,
      uploaded_by: photo.uploader.id,
    })),
  );

  // ----- bulletins with attachments + R2 objects (approved / pending / other site) -----
  const bulletinSeeds = [
    {
      name: "global-approved",
      title: "Seed bulletin: welcome back",
      scope: "global" as const,
      site_id: null,
      approval_status: "approved",
    },
    {
      name: "global-pending",
      title: "Seed bulletin: awaiting approval",
      scope: "global" as const,
      site_id: null,
      approval_status: "pending",
    },
    {
      name: "remote-approved",
      title: "Seed bulletin: Rosewood update",
      scope: "site" as const,
      site_id: remote.id,
      approval_status: "approved",
    },
  ];
  const bulletins = await insertReturning(
    BulletinTable,
    bulletinSeeds.map((bulletin) => ({
      title: bulletin.title,
      body: "Seed data; not a real announcement.",
      scope: bulletin.scope,
      site_id: bulletin.site_id,
      role_target: "all" as const,
      requires_approval: bulletin.approval_status !== "approved",
      approval_status: bulletin.approval_status,
      created_by: adminUser.id,
    })),
    "title",
  );
  const bulletinAttachments = bulletinSeeds.map((bulletin, index) => ({
    bulletin_id: bulletins[index]!.id,
    key: `bulletins/attachments/seed-${bulletin.name}.txt`,
    content: `Seed attachment for "${bulletin.title}".`,
  }));
  for (const { key, content } of bulletinAttachments) {
    await bucket.put(key, content, {
      httpMetadata: { contentType: BULLETIN_ATTACHMENT_MIME_TYPE },
    });
  }
  await db.insert(BulletinAttachmentTable).values(
    bulletinAttachments.map((attachment) => ({
      bulletin_id: attachment.bulletin_id,
      file_url: `/api/files/${attachment.key}`,
      file_name: attachment.key.split("/").pop()!,
      file_size: new TextEncoder().encode(attachment.content).length,
      mime_type: BULLETIN_ATTACHMENT_MIME_TYPE,
    })),
  );

  const summary = {
    password: SEED_PASSWORD,
    users: Object.fromEntries(
      [...users.entries()].map(([email, u]) => [email, { id: u.id, role: u.role }]),
    ),
    teacher_profile_id: teacherProfile.id,
    parent_profile_id: parentProfile.id,
    locations: { center: center.id, popup: popup.id, remote: remote.id },
    students: { mia: mia.id, leo: leo.id, ava: ava.id, noah: noah.id, owen: owen.id },
    schedules: { center: centerSchedule.id, popup: popupSchedule.id },
    attendance: { past_session_date: pastDate },
    documents: {
      mia_audiogram: `/api/files/${miaKey}`,
      leo_audiogram: `/api/files/${leoKey}`,
      mia_pre_report_pending: `/api/files/${preReportKey}`,
    },
    due_dates: { mia_next_due: miaDue, leo_next_due: leoDue },
    photos: Object.fromEntries(photos.map((photo) => [photo.name, `/api/files/${photo.key}`])),
    bulletin_attachments: Object.fromEntries(
      bulletinAttachments.map((attachment, index) => [
        bulletinSeeds[index]!.name,
        `/api/files/${attachment.key}`,
      ]),
    ),
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
