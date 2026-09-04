import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ==================== CUSTOM TYPES ====================
// SQLite has no citext type. `text collate nocase` preserves the PostgreSQL
// citext semantics (case-insensitive equality/uniqueness) on the email
// columns. NOTE: drizzle-orm 0.45 removed the sqlite `.collate()` builder
// method, hence the customType.

export const citext = customType<{ data: string }>({
  dataType() {
    return "text collate nocase";
  },
});

// ==================== ENUM TYPES ====================
// The 13 PostgreSQL pgEnums became text columns + TypeScript union types
// for Cloudflare D1 (SQLite). Values are unchanged.

export type UserRole = "administrator" | "teacher" | "parent" | "unassigned";

export type LocationType = "education_center" | "pop_up" | "remote";

export type AttendanceStatus = "present" | "late" | "no_show" | "cancelled";

export type AbsenceReason =
  | "sick"
  | "family_emergency"
  | "transportation"
  | "schedule_conflict"
  | "no_show_unknown"
  | "other";

export type DocumentType =
  | "audiogram"
  | "iep"
  | "cv"
  | "annual_test_result"
  | "pre_report"
  | "graduation_speech"
  | "other";

export type DocumentReviewStatus = "approved" | "pending" | "rejected";

export type AssessmentType = "pre" | "post";

export type HearingLossType =
  | "mild"
  | "moderate"
  | "moderately_severe"
  | "severe"
  | "profound"
  | "unknown";

export type AgeGroupSpecialty =
  | "infant"
  | "toddler"
  | "preschool"
  | "elementary"
  | "middle_school"
  | "high_school"
  | "young_adult"
  | "all_ages";

export type RequestStatus = "pending" | "negotiating" | "approved" | "denied" | "completed";

export type BulletinScope = "global" | "site";

export type BulletinRoleTarget = "all" | "administrator" | "teacher" | "parent";

export type ChatChannel = "community" | "teacher";

// ==================== CORE TABLES ====================

/* ---------------- USER ---------------- */

export const UserTable = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  authUserId: text("auth_user_id").unique(),
  email: citext("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  photo_url: text("photo_url"),
  locale: text("locale").notNull().default("en-US"),
  role: text("role", {
    enum: ["administrator", "teacher", "parent", "unassigned"] as const,
  }).notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- BETTER AUTH TABLES ---------------- */

export const AuthUserTable = sqliteTable("auth_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: citext("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const AuthSessionTable = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => AuthUserTable.id, { onDelete: "cascade" }),
});

export const AuthAccountTable = sqliteTable(
  "auth_accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => AuthUserTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("auth_accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const AuthVerificationTable = sqliteTable("auth_verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- LOCATION ---------------- */

export const LocationTable = sqliteTable(
  "locations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    type: text("type", { enum: ["education_center", "pop_up", "remote"] as const }).notNull(),
    address_line1: text("address_line1").notNull(),
    address_line2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postal_code: text("postal_code").notNull(),
    country: text("country").notNull().default("USA"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    timezone: text("timezone").notNull().default("America/Los_Angeles"),
    zoom_link: text("zoom_link"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    activeNameIdx: index("locations_active_name_idx").on(table.is_active, table.name),
    typeIdx: index("locations_type_idx").on(table.type),
    createdAtIdx: index("locations_created_at_idx").on(table.created_at),
  }),
);

/* ---------------- TEACHER PROFILE ---------------- */

export const TeacherProfileTable = sqliteTable("teacher_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id")
    .notNull()
    .references(() => UserTable.id)
    .unique(),
  primary_site_id: text("primary_site_id").references(() => LocationTable.id),
  bio: text("bio"),
  photo_url: text("photo_url"),
  qualifications: text("qualifications"),
  credentials: text("credentials"),
  age_group_specialty: text("age_group_specialty", {
    enum: [
      "infant",
      "toddler",
      "preschool",
      "elementary",
      "middle_school",
      "high_school",
      "young_adult",
      "all_ages",
    ] as const,
  }).default("all_ages"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- PARENT PROFILE ---------------- */

export const ParentProfileTable = sqliteTable("parent_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id")
    .notNull()
    .references(() => UserTable.id)
    .unique(),
  address_line1: text("address_line1"),
  address_line2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postal_code: text("postal_code"),
  household_notes: text("household_notes"),
  preferred_contact_method: text("preferred_contact_method").notNull().default("email"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- STUDENT ---------------- */

export const StudentTable = sqliteTable(
  "students",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    site_id: text("site_id")
      .notNull()
      .references(() => LocationTable.id),
    first_name: text("first_name").notNull(),
    last_name: text("last_name").notNull(),
    initials: text("initials").notNull(),
    photo_url: text("photo_url"),
    dob: text("dob").notNull(),
    current_school: text("current_school"),
    preferred_language: text("preferred_language").notNull().default("English"),
    hearing_devices: text("hearing_devices", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    hearing_loss_type: text("hearing_loss_type", {
      enum: ["mild", "moderate", "moderately_severe", "severe", "profound", "unknown"] as const,
    }),
    guardian_summary: text("guardian_summary"),
    is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    siteActiveInitialsIdx: index("students_site_active_initials_idx").on(
      table.site_id,
      table.is_active,
      table.initials,
    ),
    createdAtIdx: index("students_created_at_idx").on(table.created_at),
  }),
);

/* ---------------- SIBLING ---------------- */

export const SiblingTable = sqliteTable("siblings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  student_id: text("student_id")
    .notNull()
    .references(() => StudentTable.id),
  name: text("name").notNull(),
  age: integer("age"),
  relationship: text("relationship").notNull(),
  is_participant: integer("is_participant", { mode: "boolean" }).notNull().default(true),
  has_hearing_loss: integer("has_hearing_loss", { mode: "boolean" }).notNull().default(false),
  photo_url: text("photo_url"),
  notes: text("notes"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== SCHEDULING TABLES ====================

/* ---------------- SESSION ---------------- */

export const SessionTable = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  is_archived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- SCHEDULE ---------------- */

export const ScheduleTable = sqliteTable("schedules", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacher_id: text("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  site_id: text("site_id")
    .notNull()
    .references(() => LocationTable.id),
  session_id: text("session_id").references(() => SessionTable.id),
  day_of_week_mask: integer("day_of_week_mask").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  cycle_start_date: text("cycle_start_date").notNull(),
  cycle_end_date: text("cycle_end_date").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- ENROLLMENT ---------------- */

export const EnrollmentTable = sqliteTable("enrollments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  student_id: text("student_id")
    .notNull()
    .references(() => StudentTable.id),
  schedule_id: text("schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  enrolled_at: integer("enrolled_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  ended_at: integer("ended_at", { mode: "timestamp_ms" }),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== JUNCTION TABLES ====================

/* ---------------- TEACHER-STUDENT LINK ---------------- */

export const TeacherStudentTable = sqliteTable("teacher_student", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacher_id: text("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  student_id: text("student_id")
    .notNull()
    .references(() => StudentTable.id),
  assigned_at: integer("assigned_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  unassigned_at: integer("unassigned_at", { mode: "timestamp_ms" }),
});

/* ---------------- PARENT-STUDENT LINK ---------------- */

export const ParentStudentLinkTable = sqliteTable("parent_student_link", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parent_id: text("parent_id")
    .notNull()
    .references(() => ParentProfileTable.id),
  student_id: text("student_id")
    .notNull()
    .references(() => StudentTable.id),
  relationship: text("relationship"),
  is_primary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  linked_at: integer("linked_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  revoked_at: integer("revoked_at", { mode: "timestamp_ms" }),
});

/* ---------------- TEACHER-LOCATION LINK ---------------- */

export const TeacherLocationTable = sqliteTable(
  "teacher_locations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    teacher_profile_id: text("teacher_profile_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    location_id: text("location_id")
      .notNull()
      .references(() => LocationTable.id),
    assigned_at: integer("assigned_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    teacherLocationUnique: uniqueIndex("teacher_locations_teacher_profile_id_location_id_idx").on(
      table.teacher_profile_id,
      table.location_id,
    ),
    locationIdIdx: index("teacher_locations_location_id_idx").on(table.location_id),
  }),
);

// ==================== ATTENDANCE & NOTES ====================

/* ---------------- ATTENDANCE ---------------- */

export const AttendanceTable = sqliteTable("attendance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  student_id: text("student_id")
    .notNull()
    .references(() => StudentTable.id),
  schedule_id: text("schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  session_date: text("session_date").notNull(),
  status: text("status", {
    enum: ["present", "late", "no_show", "cancelled"] as const,
  }).notNull(),
  late_minutes: integer("late_minutes"),
  reason: text("reason", {
    enum: [
      "sick",
      "family_emergency",
      "transportation",
      "schedule_conflict",
      "no_show_unknown",
      "other",
    ] as const,
  }),
  reason_text: text("reason_text"),
  marked_by: text("marked_by")
    .notNull()
    .references(() => UserTable.id),
  marked_at: integer("marked_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const AttendanceSiblingParticipantTable = sqliteTable(
  "attendance_sibling_participants",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    attendance_id: text("attendance_id")
      .notNull()
      .references(() => AttendanceTable.id),
    sibling_id: text("sibling_id")
      .notNull()
      .references(() => SiblingTable.id),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    attendanceSiblingParticipantUnique: uniqueIndex(
      "attendance_sibling_participants_attendance_id_sibling_id_idx",
    ).on(table.attendance_id, table.sibling_id),
    siblingIdIdx: index("attendance_sibling_participants_sibling_id_idx").on(table.sibling_id),
  }),
);

/* ---------------- SESSION NOTES ---------------- */

export const SessionNoteTable = sqliteTable(
  "session_notes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    student_id: text("student_id")
      .notNull()
      .references(() => StudentTable.id),
    teacher_id: text("teacher_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    schedule_id: text("schedule_id").references(() => ScheduleTable.id),
    session_date: text("session_date"),
    note: text("note").notNull(),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    studentCreatedAtIdx: index("session_notes_student_created_at_idx").on(
      table.student_id,
      table.created_at,
    ),
    teacherCreatedAtIdx: index("session_notes_teacher_created_at_idx").on(
      table.teacher_id,
      table.created_at,
    ),
  }),
);

/* ---------------- ASSESSMENT ---------------- */

export const AssessmentTable = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    student_id: text("student_id")
      .notNull()
      .references(() => StudentTable.id),
    teacher_id: text("teacher_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    cycle_start_date: text("cycle_start_date").notNull(),
    assessment_type: text("assessment_type", {
      enum: ["pre", "post"] as const,
    }).notNull(),
    teaching_focus: text("teaching_focus").notNull(),
    summary: text("summary"),
    score: integer("score").notNull(),
    notes: text("notes"),
    assessed_at: integer("assessed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    studentCycleTypeIdx: index("assessments_student_cycle_type_idx").on(
      table.student_id,
      table.cycle_start_date,
      table.assessment_type,
    ),
    studentCycleIdx: index("assessments_student_cycle_idx").on(
      table.student_id,
      table.cycle_start_date,
    ),
  }),
);

export const AssessmentFocusTable = sqliteTable("assessment_focuses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text("assessment_id")
    .notNull()
    .references(() => AssessmentTable.id),
  goal: text("goal").notNull(),
  score: integer("score").notNull(),
  max_score: integer("max_score").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== DOCUMENTS ====================

/* ---------------- DOCUMENT ---------------- */

export const DocumentTable = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entity_type: text("entity_type").notNull(), // 'student' or 'teacher'
  entity_id: text("entity_id").notNull(),
  document_type: text("document_type", {
    enum: [
      "audiogram",
      "iep",
      "cv",
      "annual_test_result",
      "pre_report",
      "graduation_speech",
      "other",
    ] as const,
  }).notNull(),
  file_url: text("file_url").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  document_date: text("document_date"),
  next_due_date: text("next_due_date"),
  review_status: text("review_status", {
    enum: ["approved", "pending", "rejected"] as const,
  })
    .notNull()
    .default("approved"),
  reviewed_by: text("reviewed_by").references(() => UserTable.id),
  reviewed_at: integer("reviewed_at", { mode: "timestamp_ms" }),
  review_notes: text("review_notes"),
  session_date: text("session_date"),
  session_type: text("session_type"),
  uploaded_by: text("uploaded_by")
    .notNull()
    .references(() => UserTable.id),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== BULLETINS ====================

/* ---------------- BULLETIN ---------------- */

export const BulletinTable = sqliteTable(
  "bulletins",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    site_id: text("site_id").references(() => LocationTable.id),
    scope: text("scope", { enum: ["global", "site"] as const }).notNull().default("global"),
    role_target: text("role_target", {
      enum: ["all", "administrator", "teacher", "parent"] as const,
    })
      .notNull()
      .default("all"),
    requires_approval: integer("requires_approval", { mode: "boolean" })
      .notNull()
      .default(false),
    approval_status: text("approval_status").notNull().default("approved"),
    title: text("title").notNull(),
    body: text("body"),
    requires_initials: integer("requires_initials", { mode: "boolean" })
      .notNull()
      .default(false),
    publish_at: integer("publish_at", { mode: "timestamp_ms" }),
    expire_at: integer("expire_at", { mode: "timestamp_ms" }),
    reviewed_by: text("reviewed_by").references(() => UserTable.id),
    reviewed_at: integer("reviewed_at", { mode: "timestamp_ms" }),
    review_notes: text("review_notes"),
    created_by: text("created_by")
      .notNull()
      .references(() => UserTable.id),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    approvalStatusCreatedAtIdx: index("bulletins_approval_status_created_at_idx").on(
      table.approval_status,
      table.created_at,
    ),
  }),
);

/* ---------------- BULLETIN ATTACHMENT ---------------- */

export const BulletinAttachmentTable = sqliteTable("bulletin_attachments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bulletin_id: text("bulletin_id")
    .notNull()
    .references(() => BulletinTable.id),
  file_url: text("file_url").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- BULLETIN VIEW ---------------- */

export const BulletinViewTable = sqliteTable(
  "bulletin_views",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    bulletin_id: text("bulletin_id")
      .notNull()
      .references(() => BulletinTable.id),
    user_id: text("user_id")
      .notNull()
      .references(() => UserTable.id),
    viewed_at: integer("viewed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    last_viewed_at: integer("last_viewed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    bulletinViewUnique: uniqueIndex("bulletin_views_bulletin_id_user_id_idx").on(
      table.bulletin_id,
      table.user_id,
    ),
  }),
);

/* ---------------- BULLETIN ACKNOWLEDGEMENT ---------------- */

export const BulletinAcknowledgementTable = sqliteTable(
  "bulletin_acknowledgements",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    bulletin_id: text("bulletin_id")
      .notNull()
      .references(() => BulletinTable.id),
    user_id: text("user_id")
      .notNull()
      .references(() => UserTable.id),
    initials: text("initials").notNull(),
    acknowledged_at: integer("acknowledged_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    bulletinAcknowledgementUnique: uniqueIndex("bulletin_acknowledgements_bulletin_id_user_id_idx").on(
      table.bulletin_id,
      table.user_id,
    ),
  }),
);

/* ---------------- TEACHER SICK DAY NOTICE ---------------- */

export const TeacherSickDayNoticeTable = sqliteTable(
  "teacher_sick_day_notices",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    teacher_id: text("teacher_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    site_id: text("site_id")
      .notNull()
      .references(() => LocationTable.id),
    notice_date: text("notice_date").notNull(),
    note: text("note"),
    bulletin_id: text("bulletin_id").references(() => BulletinTable.id),
    created_by: text("created_by")
      .notNull()
      .references(() => UserTable.id),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    teacherDateIdx: index("teacher_sick_day_notices_teacher_date_idx").on(
      table.teacher_id,
      table.notice_date,
    ),
    siteDateIdx: index("teacher_sick_day_notices_site_date_idx").on(
      table.site_id,
      table.notice_date,
    ),
  }),
);

/* ---------------- CHAT MESSAGE ---------------- */

export const ChatMessageTable = sqliteTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  channel: text("channel", { enum: ["community", "teacher"] as const })
    .notNull()
    .default("community"),
  message: text("message").notNull(),
  is_announcement: integer("is_announcement", { mode: "boolean" }).notNull().default(false),
  created_by: text("created_by")
    .notNull()
    .references(() => UserTable.id),
  deleted_at: integer("deleted_at", { mode: "timestamp_ms" }),
  deleted_by: text("deleted_by").references(() => UserTable.id),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---------------- SESSION PHOTO ---------------- */

export const PhotoTable = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    location_id: text("location_id")
      .notNull()
      .references(() => LocationTable.id),
    student_id: text("student_id").references(() => StudentTable.id),
    session_date: text("session_date").notNull(),
    caption: text("caption"),
    file_url: text("file_url").notNull(),
    file_name: text("file_name").notNull(),
    file_size: integer("file_size"),
    mime_type: text("mime_type"),
    uploaded_by: text("uploaded_by")
      .notNull()
      .references(() => UserTable.id),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    locationSessionCreatedIdx: index("photos_location_session_created_idx").on(
      table.location_id,
      table.session_date,
      table.created_at,
    ),
    studentSessionCreatedIdx: index("photos_student_session_created_idx").on(
      table.student_id,
      table.session_date,
      table.created_at,
    ),
  }),
);

// ==================== MAKE-UP SYSTEM ====================

/* ---------------- MAKEUP REQUEST ---------------- */

export const MakeupRequestTable = sqliteTable(
  "makeup_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    student_id: text("student_id")
      .notNull()
      .references(() => StudentTable.id),
    original_session_date: text("original_session_date").notNull(),
    original_schedule_id: text("original_schedule_id")
      .notNull()
      .references(() => ScheduleTable.id),
    reason: text("reason", {
      enum: [
        "sick",
        "family_emergency",
        "transportation",
        "schedule_conflict",
        "no_show_unknown",
        "other",
      ] as const,
    }).notNull(),
    reason_text: text("reason_text"),
    preferred_dates: text("preferred_dates"),
    status: text("status", {
      enum: ["pending", "negotiating", "approved", "denied", "completed"] as const,
    })
      .notNull()
      .default("pending"),
    requested_by: text("requested_by")
      .notNull()
      .references(() => UserTable.id),
    requested_at: integer("requested_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    reviewed_by: text("reviewed_by").references(() => UserTable.id),
    reviewed_at: integer("reviewed_at", { mode: "timestamp_ms" }),
    review_notes: text("review_notes"),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    statusRequestedAtIdx: index("makeup_requests_status_requested_at_idx").on(
      table.status,
      table.requested_at,
    ),
    studentIdIdx: index("makeup_requests_student_id_idx").on(table.student_id),
    originalScheduleIdIdx: index("makeup_requests_original_schedule_id_idx").on(
      table.original_schedule_id,
    ),
  }),
);

/* ---------------- MAKEUP SESSION ---------------- */

export const MakeupSessionTable = sqliteTable(
  "makeup_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    makeup_request_id: text("makeup_request_id").references(() => MakeupRequestTable.id),
    student_id: text("student_id")
      .notNull()
      .references(() => StudentTable.id),
    teacher_id: text("teacher_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    site_id: text("site_id")
      .notNull()
      .references(() => LocationTable.id),
    scheduled_date: text("scheduled_date").notNull(),
    scheduled_time: text("scheduled_time").notNull(),
    attendance_status: text("attendance_status", {
      enum: ["present", "late", "no_show", "cancelled"] as const,
    }),
    notes: text("notes"),
    created_by: text("created_by")
      .notNull()
      .references(() => UserTable.id),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    makeupRequestCreatedAtIdx: index("makeup_sessions_makeup_request_id_created_at_idx").on(
      table.makeup_request_id,
      table.created_at,
    ),
    teacherDateIdx: index("makeup_sessions_teacher_date_idx").on(
      table.teacher_id,
      table.scheduled_date,
    ),
  }),
);

// ==================== SCHEDULE CHANGE SYSTEM ====================

/* ---------------- SCHEDULE CHANGE REQUEST ---------------- */

export const ScheduleChangeRequestTable = sqliteTable(
  "schedule_change_requests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    student_id: text("student_id")
      .notNull()
      .references(() => StudentTable.id),
    current_schedule_id: text("current_schedule_id")
      .notNull()
      .references(() => ScheduleTable.id),
    requested_schedule_id: text("requested_schedule_id").references(() => ScheduleTable.id),
    preferred_times: text("preferred_times"),
    flexibility_notes: text("flexibility_notes"),
    reason: text("reason").notNull(),
    status: text("status", {
      enum: ["pending", "negotiating", "approved", "denied", "completed"] as const,
    })
      .notNull()
      .default("pending"),
    requested_by: text("requested_by")
      .notNull()
      .references(() => UserTable.id),
    teacher_response_status: text("teacher_response_status"),
    teacher_response_notes: text("teacher_response_notes"),
    teacher_responded_by: text("teacher_responded_by").references(() => UserTable.id),
    teacher_responded_at: integer("teacher_responded_at", { mode: "timestamp_ms" }),
    requested_at: integer("requested_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    reviewed_by: text("reviewed_by").references(() => UserTable.id),
    reviewed_at: integer("reviewed_at", { mode: "timestamp_ms" }),
    review_notes: text("review_notes"),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    statusRequestedAtIdx: index("schedule_change_requests_status_requested_at_idx").on(
      table.status,
      table.requested_at,
    ),
    studentIdIdx: index("schedule_change_requests_student_id_idx").on(table.student_id),
    currentScheduleIdIdx: index("schedule_change_requests_current_schedule_id_idx").on(
      table.current_schedule_id,
    ),
    requestedScheduleIdIdx: index("schedule_change_requests_requested_schedule_id_idx").on(
      table.requested_schedule_id,
    ),
  }),
);

export const ScheduleChangeRequestEventTable = sqliteTable("schedule_change_request_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  schedule_change_request_id: text("schedule_change_request_id")
    .notNull()
    .references(() => ScheduleChangeRequestTable.id),
  event_type: text("event_type").notNull(),
  from_status: text("from_status"),
  to_status: text("to_status"),
  actor_user_id: text("actor_user_id")
    .notNull()
    .references(() => UserTable.id),
  notes: text("notes"),
  created_at: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ==================== RELATIONS ====================

export const userRelations = relations(UserTable, ({ one }) => ({
  authUser: one(AuthUserTable, {
    fields: [UserTable.authUserId],
    references: [AuthUserTable.id],
  }),
  teacherProfile: one(TeacherProfileTable, {
    fields: [UserTable.id],
    references: [TeacherProfileTable.user_id],
  }),
  parentProfile: one(ParentProfileTable, {
    fields: [UserTable.id],
    references: [ParentProfileTable.user_id],
  }),
}));

export const authUserRelations = relations(AuthUserTable, ({ many }) => ({
  sessions: many(AuthSessionTable),
  accounts: many(AuthAccountTable),
}));

export const authSessionRelations = relations(AuthSessionTable, ({ one }) => ({
  user: one(AuthUserTable, {
    fields: [AuthSessionTable.userId],
    references: [AuthUserTable.id],
  }),
}));

export const authAccountRelations = relations(AuthAccountTable, ({ one }) => ({
  user: one(AuthUserTable, {
    fields: [AuthAccountTable.userId],
    references: [AuthUserTable.id],
  }),
}));

export const teacherProfileRelations = relations(TeacherProfileTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [TeacherProfileTable.user_id],
    references: [UserTable.id],
  }),
  primarySite: one(LocationTable, {
    fields: [TeacherProfileTable.primary_site_id],
    references: [LocationTable.id],
  }),
  schedules: many(ScheduleTable),
  teacherStudents: many(TeacherStudentTable),
  teacherLocations: many(TeacherLocationTable),
  sessionNotes: many(SessionNoteTable),
  assessments: many(AssessmentTable),
  makeupSessions: many(MakeupSessionTable),
  sickDayNotices: many(TeacherSickDayNoticeTable),
}));

export const parentProfileRelations = relations(ParentProfileTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [ParentProfileTable.user_id],
    references: [UserTable.id],
  }),
  parentStudentLinks: many(ParentStudentLinkTable),
}));

export const locationRelations = relations(LocationTable, ({ many }) => ({
  teachers: many(TeacherProfileTable),
  teacherLocations: many(TeacherLocationTable),
  students: many(StudentTable),
  schedules: many(ScheduleTable),
  bulletins: many(BulletinTable),
  makeupSessions: many(MakeupSessionTable),
  teacherSickDayNotices: many(TeacherSickDayNoticeTable),
}));

export const sessionRelations = relations(SessionTable, ({ many }) => ({
  schedules: many(ScheduleTable),
}));

export const studentRelations = relations(StudentTable, ({ one, many }) => ({
  site: one(LocationTable, {
    fields: [StudentTable.site_id],
    references: [LocationTable.id],
  }),
  siblings: many(SiblingTable),
  teacherStudents: many(TeacherStudentTable),
  parentStudentLinks: many(ParentStudentLinkTable),
  enrollments: many(EnrollmentTable),
  attendance: many(AttendanceTable),
  sessionNotes: many(SessionNoteTable),
  assessments: many(AssessmentTable),
  documents: many(DocumentTable),
  makeupRequests: many(MakeupRequestTable),
  makeupSessions: many(MakeupSessionTable),
  scheduleChangeRequests: many(ScheduleChangeRequestTable),
}));

export const siblingRelations = relations(SiblingTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [SiblingTable.student_id],
    references: [StudentTable.id],
  }),
}));

export const scheduleRelations = relations(ScheduleTable, ({ one, many }) => ({
  teacher: one(TeacherProfileTable, {
    fields: [ScheduleTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  site: one(LocationTable, {
    fields: [ScheduleTable.site_id],
    references: [LocationTable.id],
  }),
  session: one(SessionTable, {
    fields: [ScheduleTable.session_id],
    references: [SessionTable.id],
  }),
  enrollments: many(EnrollmentTable),
  attendance: many(AttendanceTable),
  sessionNotes: many(SessionNoteTable),
}));

export const enrollmentRelations = relations(EnrollmentTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [EnrollmentTable.student_id],
    references: [StudentTable.id],
  }),
  schedule: one(ScheduleTable, {
    fields: [EnrollmentTable.schedule_id],
    references: [ScheduleTable.id],
  }),
}));

export const teacherStudentRelations = relations(TeacherStudentTable, ({ one }) => ({
  teacher: one(TeacherProfileTable, {
    fields: [TeacherStudentTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  student: one(StudentTable, {
    fields: [TeacherStudentTable.student_id],
    references: [StudentTable.id],
  }),
}));

export const parentStudentLinkRelations = relations(ParentStudentLinkTable, ({ one }) => ({
  parent: one(ParentProfileTable, {
    fields: [ParentStudentLinkTable.parent_id],
    references: [ParentProfileTable.id],
  }),
  student: one(StudentTable, {
    fields: [ParentStudentLinkTable.student_id],
    references: [StudentTable.id],
  }),
}));

export const teacherLocationRelations = relations(TeacherLocationTable, ({ one }) => ({
  teacher: one(TeacherProfileTable, {
    fields: [TeacherLocationTable.teacher_profile_id],
    references: [TeacherProfileTable.id],
  }),
  location: one(LocationTable, {
    fields: [TeacherLocationTable.location_id],
    references: [LocationTable.id],
  }),
}));

export const attendanceRelations = relations(AttendanceTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [AttendanceTable.student_id],
    references: [StudentTable.id],
  }),
  schedule: one(ScheduleTable, {
    fields: [AttendanceTable.schedule_id],
    references: [ScheduleTable.id],
  }),
  markedByUser: one(UserTable, {
    fields: [AttendanceTable.marked_by],
    references: [UserTable.id],
  }),
}));

export const attendanceSiblingParticipantRelations = relations(
  AttendanceSiblingParticipantTable,
  ({ one }) => ({
    attendance: one(AttendanceTable, {
      fields: [AttendanceSiblingParticipantTable.attendance_id],
      references: [AttendanceTable.id],
    }),
    sibling: one(SiblingTable, {
      fields: [AttendanceSiblingParticipantTable.sibling_id],
      references: [SiblingTable.id],
    }),
  }),
);

export const sessionNoteRelations = relations(SessionNoteTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [SessionNoteTable.student_id],
    references: [StudentTable.id],
  }),
  teacher: one(TeacherProfileTable, {
    fields: [SessionNoteTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  schedule: one(ScheduleTable, {
    fields: [SessionNoteTable.schedule_id],
    references: [ScheduleTable.id],
  }),
}));

export const assessmentRelations = relations(AssessmentTable, ({ one, many }) => ({
  student: one(StudentTable, {
    fields: [AssessmentTable.student_id],
    references: [StudentTable.id],
  }),
  teacher: one(TeacherProfileTable, {
    fields: [AssessmentTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  focuses: many(AssessmentFocusTable),
}));

export const assessmentFocusRelations = relations(AssessmentFocusTable, ({ one }) => ({
  assessment: one(AssessmentTable, {
    fields: [AssessmentFocusTable.assessment_id],
    references: [AssessmentTable.id],
  }),
}));

export const documentRelations = relations(DocumentTable, ({ one }) => ({
  uploadedByUser: one(UserTable, {
    fields: [DocumentTable.uploaded_by],
    references: [UserTable.id],
  }),
  reviewedByUser: one(UserTable, {
    fields: [DocumentTable.reviewed_by],
    references: [UserTable.id],
  }),
}));

export const bulletinRelations = relations(BulletinTable, ({ one, many }) => ({
  site: one(LocationTable, {
    fields: [BulletinTable.site_id],
    references: [LocationTable.id],
  }),
  createdByUser: one(UserTable, {
    fields: [BulletinTable.created_by],
    references: [UserTable.id],
  }),
  attachments: many(BulletinAttachmentTable),
  views: many(BulletinViewTable),
  acknowledgements: many(BulletinAcknowledgementTable),
  sickDayNotices: many(TeacherSickDayNoticeTable),
}));

export const teacherSickDayNoticeRelations = relations(TeacherSickDayNoticeTable, ({ one }) => ({
  teacher: one(TeacherProfileTable, {
    fields: [TeacherSickDayNoticeTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  site: one(LocationTable, {
    fields: [TeacherSickDayNoticeTable.site_id],
    references: [LocationTable.id],
  }),
  bulletin: one(BulletinTable, {
    fields: [TeacherSickDayNoticeTable.bulletin_id],
    references: [BulletinTable.id],
  }),
  createdByUser: one(UserTable, {
    fields: [TeacherSickDayNoticeTable.created_by],
    references: [UserTable.id],
  }),
}));

export const bulletinAttachmentRelations = relations(BulletinAttachmentTable, ({ one }) => ({
  bulletin: one(BulletinTable, {
    fields: [BulletinAttachmentTable.bulletin_id],
    references: [BulletinTable.id],
  }),
}));

export const bulletinViewRelations = relations(BulletinViewTable, ({ one }) => ({
  bulletin: one(BulletinTable, {
    fields: [BulletinViewTable.bulletin_id],
    references: [BulletinTable.id],
  }),
  user: one(UserTable, {
    fields: [BulletinViewTable.user_id],
    references: [UserTable.id],
  }),
}));

export const bulletinAcknowledgementRelations = relations(BulletinAcknowledgementTable, ({ one }) => ({
  bulletin: one(BulletinTable, {
    fields: [BulletinAcknowledgementTable.bulletin_id],
    references: [BulletinTable.id],
  }),
  user: one(UserTable, {
    fields: [BulletinAcknowledgementTable.user_id],
    references: [UserTable.id],
  }),
}));

export const chatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  createdByUser: one(UserTable, {
    fields: [ChatMessageTable.created_by],
    references: [UserTable.id],
  }),
  deletedByUser: one(UserTable, {
    fields: [ChatMessageTable.deleted_by],
    references: [UserTable.id],
  }),
}));

export const photoRelations = relations(PhotoTable, ({ one }) => ({
  location: one(LocationTable, {
    fields: [PhotoTable.location_id],
    references: [LocationTable.id],
  }),
  student: one(StudentTable, {
    fields: [PhotoTable.student_id],
    references: [StudentTable.id],
  }),
  uploadedByUser: one(UserTable, {
    fields: [PhotoTable.uploaded_by],
    references: [UserTable.id],
  }),
}));

export const makeupRequestRelations = relations(MakeupRequestTable, ({ one, many }) => ({
  student: one(StudentTable, {
    fields: [MakeupRequestTable.student_id],
    references: [StudentTable.id],
  }),
  originalSchedule: one(ScheduleTable, {
    fields: [MakeupRequestTable.original_schedule_id],
    references: [ScheduleTable.id],
  }),
  requestedByUser: one(UserTable, {
    fields: [MakeupRequestTable.requested_by],
    references: [UserTable.id],
  }),
  reviewedByUser: one(UserTable, {
    fields: [MakeupRequestTable.reviewed_by],
    references: [UserTable.id],
  }),
  makeupSessions: many(MakeupSessionTable),
}));

export const makeupSessionRelations = relations(MakeupSessionTable, ({ one }) => ({
  makeupRequest: one(MakeupRequestTable, {
    fields: [MakeupSessionTable.makeup_request_id],
    references: [MakeupRequestTable.id],
  }),
  student: one(StudentTable, {
    fields: [MakeupSessionTable.student_id],
    references: [StudentTable.id],
  }),
  teacher: one(TeacherProfileTable, {
    fields: [MakeupSessionTable.teacher_id],
    references: [TeacherProfileTable.id],
  }),
  site: one(LocationTable, {
    fields: [MakeupSessionTable.site_id],
    references: [LocationTable.id],
  }),
  createdByUser: one(UserTable, {
    fields: [MakeupSessionTable.created_by],
    references: [UserTable.id],
  }),
}));

export const scheduleChangeRequestRelations = relations(ScheduleChangeRequestTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [ScheduleChangeRequestTable.student_id],
    references: [StudentTable.id],
  }),
  currentSchedule: one(ScheduleTable, {
    fields: [ScheduleChangeRequestTable.current_schedule_id],
    references: [ScheduleTable.id],
  }),
  requestedSchedule: one(ScheduleTable, {
    fields: [ScheduleChangeRequestTable.requested_schedule_id],
    references: [ScheduleTable.id],
  }),
  requestedByUser: one(UserTable, {
    fields: [ScheduleChangeRequestTable.requested_by],
    references: [UserTable.id],
  }),
  reviewedByUser: one(UserTable, {
    fields: [ScheduleChangeRequestTable.reviewed_by],
    references: [UserTable.id],
  }),
}));

export const scheduleChangeRequestEventRelations = relations(
  ScheduleChangeRequestEventTable,
  ({ one }) => ({
    scheduleChangeRequest: one(ScheduleChangeRequestTable, {
      fields: [ScheduleChangeRequestEventTable.schedule_change_request_id],
      references: [ScheduleChangeRequestTable.id],
    }),
    actorUser: one(UserTable, {
      fields: [ScheduleChangeRequestEventTable.actor_user_id],
      references: [UserTable.id],
    }),
  }),
);

// ==================== TYPE EXPORTS ====================

export type UserEntity = typeof UserTable.$inferSelect;
export type UserInsert = typeof UserTable.$inferInsert;

export type AuthUserEntity = typeof AuthUserTable.$inferSelect;
export type AuthUserInsert = typeof AuthUserTable.$inferInsert;

export type AuthSessionEntity = typeof AuthSessionTable.$inferSelect;
export type AuthSessionInsert = typeof AuthSessionTable.$inferInsert;

export type AuthAccountEntity = typeof AuthAccountTable.$inferSelect;
export type AuthAccountInsert = typeof AuthAccountTable.$inferInsert;

export type AuthVerificationEntity = typeof AuthVerificationTable.$inferSelect;
export type AuthVerificationInsert = typeof AuthVerificationTable.$inferInsert;

export type LocationEntity = typeof LocationTable.$inferSelect;
export type LocationInsert = typeof LocationTable.$inferInsert;

export type TeacherProfileEntity = typeof TeacherProfileTable.$inferSelect;
export type TeacherProfileInsert = typeof TeacherProfileTable.$inferInsert;

export type ParentProfileEntity = typeof ParentProfileTable.$inferSelect;
export type ParentProfileInsert = typeof ParentProfileTable.$inferInsert;

export type StudentEntity = typeof StudentTable.$inferSelect;
export type StudentInsert = typeof StudentTable.$inferInsert;

export type SessionEntity = typeof SessionTable.$inferSelect;
export type SessionInsert = typeof SessionTable.$inferInsert;

export type SiblingEntity = typeof SiblingTable.$inferSelect;
export type SiblingInsert = typeof SiblingTable.$inferInsert;

export type ScheduleEntity = typeof ScheduleTable.$inferSelect;
export type ScheduleInsert = typeof ScheduleTable.$inferInsert;

export type EnrollmentEntity = typeof EnrollmentTable.$inferSelect;
export type EnrollmentInsert = typeof EnrollmentTable.$inferInsert;

export type TeacherStudentEntity = typeof TeacherStudentTable.$inferSelect;
export type TeacherStudentInsert = typeof TeacherStudentTable.$inferInsert;

export type ParentStudentLinkEntity = typeof ParentStudentLinkTable.$inferSelect;
export type ParentStudentLinkInsert = typeof ParentStudentLinkTable.$inferInsert;

export type TeacherLocationEntity = typeof TeacherLocationTable.$inferSelect;
export type TeacherLocationInsert = typeof TeacherLocationTable.$inferInsert;

export type AttendanceEntity = typeof AttendanceTable.$inferSelect;
export type AttendanceInsert = typeof AttendanceTable.$inferInsert;

export type AttendanceSiblingParticipantEntity = typeof AttendanceSiblingParticipantTable.$inferSelect;
export type AttendanceSiblingParticipantInsert = typeof AttendanceSiblingParticipantTable.$inferInsert;

export type SessionNoteEntity = typeof SessionNoteTable.$inferSelect;
export type SessionNoteInsert = typeof SessionNoteTable.$inferInsert;

export type AssessmentEntity = typeof AssessmentTable.$inferSelect;
export type AssessmentInsert = typeof AssessmentTable.$inferInsert;

export type AssessmentFocusEntity = typeof AssessmentFocusTable.$inferSelect;
export type AssessmentFocusInsert = typeof AssessmentFocusTable.$inferInsert;

export type DocumentEntity = typeof DocumentTable.$inferSelect;
export type DocumentInsert = typeof DocumentTable.$inferInsert;

export type BulletinEntity = typeof BulletinTable.$inferSelect;
export type BulletinInsert = typeof BulletinTable.$inferInsert;

export type BulletinAttachmentEntity = typeof BulletinAttachmentTable.$inferSelect;
export type BulletinAttachmentInsert = typeof BulletinAttachmentTable.$inferInsert;

export type BulletinViewEntity = typeof BulletinViewTable.$inferSelect;
export type BulletinViewInsert = typeof BulletinViewTable.$inferInsert;

export type BulletinAcknowledgementEntity = typeof BulletinAcknowledgementTable.$inferSelect;
export type BulletinAcknowledgementInsert = typeof BulletinAcknowledgementTable.$inferInsert;

export type TeacherSickDayNoticeEntity = typeof TeacherSickDayNoticeTable.$inferSelect;
export type TeacherSickDayNoticeInsert = typeof TeacherSickDayNoticeTable.$inferInsert;

export type ChatMessageEntity = typeof ChatMessageTable.$inferSelect;
export type ChatMessageInsert = typeof ChatMessageTable.$inferInsert;

export type PhotoEntity = typeof PhotoTable.$inferSelect;
export type PhotoInsert = typeof PhotoTable.$inferInsert;

export type MakeupRequestEntity = typeof MakeupRequestTable.$inferSelect;
export type MakeupRequestInsert = typeof MakeupRequestTable.$inferInsert;

export type MakeupSessionEntity = typeof MakeupSessionTable.$inferSelect;
export type MakeupSessionInsert = typeof MakeupSessionTable.$inferInsert;

export type ScheduleChangeRequestEntity = typeof ScheduleChangeRequestTable.$inferSelect;
export type ScheduleChangeRequestInsert = typeof ScheduleChangeRequestTable.$inferInsert;

export type ScheduleChangeRequestEventEntity = typeof ScheduleChangeRequestEventTable.$inferSelect;
export type ScheduleChangeRequestEventInsert = typeof ScheduleChangeRequestEventTable.$inferInsert;