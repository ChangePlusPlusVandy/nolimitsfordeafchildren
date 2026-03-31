import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  varchar,
  date,
  time,
  integer,
  numeric,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==================== CUSTOM TYPES ====================

import { customType } from "drizzle-orm/pg-core";

export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum("user_role", ["administrator", "teacher", "parent"]);

export const locationTypeEnum = pgEnum("location_type", ["education_center", "pop_up", "remote"]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "late",
  "no_show",
  "cancelled",
]);

export const absenceReasonEnum = pgEnum("absence_reason", [
  "sick",
  "family_emergency",
  "transportation",
  "schedule_conflict",
  "no_show_unknown",
  "other",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "audiogram",
  "iep",
  "cv",
  "annual_test_result",
  "pre_report",
  "graduation_speech",
  "other",
]);

export const documentReviewStatusEnum = pgEnum("document_review_status", [
  "approved",
  "pending",
  "rejected",
]);

export const assessmentTypeEnum = pgEnum("assessment_type", ["pre", "post"]);

export const ageGroupSpecialtyEnum = pgEnum("age_group_specialty", [
  "infant",
  "toddler",
  "preschool",
  "elementary",
  "middle_school",
  "high_school",
  "young_adult",
  "all_ages",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "negotiating",
  "approved",
  "denied",
  "completed",
]);

export const bulletinScopeEnum = pgEnum("bulletin_scope", ["global", "site"]);

export const bulletinRoleTargetEnum = pgEnum("bulletin_role_target", [
  "all",
  "administrator",
  "teacher",
  "parent",
]);

export const chatChannelEnum = pgEnum("chat_channel", ["community", "teacher"]);

// ==================== CORE TABLES ====================

/* ---------------- USER ---------------- */

export const UserTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  auth0Id: text("auth0_id").notNull().unique(),
  email: citext("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  photo_url: text("photo_url"),
  locale: text("locale").notNull().default("en-US"),
  role: userRoleEnum("role").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- LOCATION ---------------- */

export const LocationTable = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").notNull(),
  address_line1: text("address_line1").notNull(),
  address_line2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postal_code: text("postal_code").notNull(),
  country: text("country").notNull().default("USA"),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  timezone: text("timezone").notNull().default("America/Los_Angeles"),
  zoom_link: text("zoom_link"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- TEACHER PROFILE ---------------- */

export const TeacherProfileTable = pgTable("teacher_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => UserTable.id)
    .unique(),
  primary_site_id: uuid("primary_site_id").references(() => LocationTable.id),
  bio: text("bio"),
  photo_url: text("photo_url"),
  qualifications: text("qualifications"),
  credentials: text("credentials"),
  age_group_specialty: ageGroupSpecialtyEnum("age_group_specialty").default("all_ages"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- PARENT PROFILE ---------------- */

export const ParentProfileTable = pgTable("parent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
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
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- STUDENT ---------------- */

export const StudentTable = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  site_id: uuid("site_id")
    .notNull()
    .references(() => LocationTable.id),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  initials: varchar("initials", { length: 8 }).notNull(),
  photo_url: text("photo_url"),
  dob: date("dob").notNull(),
  current_school: text("current_school"),
  preferred_language: text("preferred_language").notNull().default("English"),
  guardian_summary: text("guardian_summary"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- SIBLING ---------------- */

export const SiblingTable = pgTable("siblings", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  name: text("name").notNull(),
  age: integer("age"),
  relationship: text("relationship").notNull(),
  is_participant: boolean("is_participant").notNull().default(true),
  has_hearing_loss: boolean("has_hearing_loss").notNull().default(false),
  photo_url: text("photo_url"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== SCHEDULING TABLES ====================

/* ---------------- SESSION ---------------- */

export const SessionTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  is_archived: boolean("is_archived").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- SCHEDULE ---------------- */

export const ScheduleTable = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacher_id: uuid("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  site_id: uuid("site_id")
    .notNull()
    .references(() => LocationTable.id),
  session_id: uuid("session_id").references(() => SessionTable.id),
  day_of_week_mask: integer("day_of_week_mask").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  cycle_start_date: date("cycle_start_date").notNull(),
  cycle_end_date: date("cycle_end_date").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- ENROLLMENT ---------------- */

export const EnrollmentTable = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  schedule_id: uuid("schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  enrolled_at: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  ended_at: timestamp("ended_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== JUNCTION TABLES ====================

/* ---------------- TEACHER-STUDENT LINK ---------------- */

export const TeacherStudentTable = pgTable("teacher_student", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacher_id: uuid("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  unassigned_at: timestamp("unassigned_at", { withTimezone: true }),
});

/* ---------------- PARENT-STUDENT LINK ---------------- */

export const ParentStudentLinkTable = pgTable("parent_student_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  parent_id: uuid("parent_id")
    .notNull()
    .references(() => ParentProfileTable.id),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  relationship: text("relationship"),
  is_primary: boolean("is_primary").notNull().default(false),
  linked_at: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
  revoked_at: timestamp("revoked_at", { withTimezone: true }),
});

/* ---------------- TEACHER-LOCATION LINK ---------------- */

export const TeacherLocationTable = pgTable(
  "teacher_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacher_profile_id: uuid("teacher_profile_id")
      .notNull()
      .references(() => TeacherProfileTable.id),
    location_id: uuid("location_id")
      .notNull()
      .references(() => LocationTable.id),
    assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    teacherLocationUnique: uniqueIndex("teacher_locations_teacher_profile_id_location_id_idx").on(
      table.teacher_profile_id,
      table.location_id,
    ),
  }),
);

// ==================== ATTENDANCE & NOTES ====================

/* ---------------- ATTENDANCE ---------------- */

export const AttendanceTable = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  schedule_id: uuid("schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  session_date: date("session_date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  late_minutes: integer("late_minutes"),
  reason: absenceReasonEnum("reason"),
  reason_text: text("reason_text"),
  marked_by: uuid("marked_by")
    .notNull()
    .references(() => UserTable.id),
  marked_at: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- SESSION NOTES ---------------- */

export const SessionNoteTable = pgTable("session_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  teacher_id: uuid("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  schedule_id: uuid("schedule_id").references(() => ScheduleTable.id),
  session_date: date("session_date"),
  note: text("note").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- ASSESSMENT ---------------- */

export const AssessmentTable = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  teacher_id: uuid("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  cycle_start_date: date("cycle_start_date").notNull(),
  assessment_type: assessmentTypeEnum("assessment_type").notNull(),
  teaching_focus: text("teaching_focus").notNull(),
  summary: text("summary"),
  score: integer("score").notNull(),
  notes: text("notes"),
  assessed_at: timestamp("assessed_at", { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== DOCUMENTS ====================

/* ---------------- DOCUMENT ---------------- */

export const DocumentTable = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  entity_type: text("entity_type").notNull(), // 'student' or 'teacher'
  entity_id: uuid("entity_id").notNull(),
  document_type: documentTypeEnum("document_type").notNull(),
  file_url: text("file_url").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  document_date: date("document_date"),
  next_due_date: date("next_due_date"),
  review_status: documentReviewStatusEnum("review_status").notNull().default("approved"),
  reviewed_by: uuid("reviewed_by").references(() => UserTable.id),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  review_notes: text("review_notes"),
  session_date: date("session_date"),
  session_type: text("session_type"),
  uploaded_by: uuid("uploaded_by")
    .notNull()
    .references(() => UserTable.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== BULLETINS ====================

/* ---------------- BULLETIN ---------------- */

export const BulletinTable = pgTable("bulletins", {
  id: uuid("id").primaryKey().defaultRandom(),
  site_id: uuid("site_id").references(() => LocationTable.id),
  scope: bulletinScopeEnum("scope").notNull().default("global"),
  role_target: bulletinRoleTargetEnum("role_target").notNull().default("all"),
  title: text("title").notNull(),
  body: text("body"),
  publish_at: timestamp("publish_at", { withTimezone: true }),
  expire_at: timestamp("expire_at", { withTimezone: true }),
  created_by: uuid("created_by")
    .notNull()
    .references(() => UserTable.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- BULLETIN ATTACHMENT ---------------- */

export const BulletinAttachmentTable = pgTable("bulletin_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bulletin_id: uuid("bulletin_id")
    .notNull()
    .references(() => BulletinTable.id),
  file_url: text("file_url").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size"),
  mime_type: text("mime_type"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- BULLETIN VIEW ---------------- */

export const BulletinViewTable = pgTable(
  "bulletin_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bulletin_id: uuid("bulletin_id")
      .notNull()
      .references(() => BulletinTable.id),
    user_id: uuid("user_id")
      .notNull()
      .references(() => UserTable.id),
    viewed_at: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
    last_viewed_at: timestamp("last_viewed_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bulletinViewUnique: uniqueIndex("bulletin_views_bulletin_id_user_id_idx").on(
      table.bulletin_id,
      table.user_id,
    ),
  }),
);

/* ---------------- BULLETIN ACKNOWLEDGEMENT ---------------- */

export const BulletinAcknowledgementTable = pgTable(
  "bulletin_acknowledgements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bulletin_id: uuid("bulletin_id")
      .notNull()
      .references(() => BulletinTable.id),
    user_id: uuid("user_id")
      .notNull()
      .references(() => UserTable.id),
    initials: varchar("initials", { length: 8 }).notNull(),
    acknowledged_at: timestamp("acknowledged_at", { withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    bulletinAcknowledgementUnique: uniqueIndex("bulletin_acknowledgements_bulletin_id_user_id_idx").on(
      table.bulletin_id,
      table.user_id,
    ),
  }),
);

/* ---------------- CHAT MESSAGE ---------------- */

export const ChatMessageTable = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: chatChannelEnum("channel").notNull().default("community"),
  message: text("message").notNull(),
  is_announcement: boolean("is_announcement").notNull().default(false),
  created_by: uuid("created_by")
    .notNull()
    .references(() => UserTable.id),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  deleted_by: uuid("deleted_by").references(() => UserTable.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== MAKE-UP SYSTEM ====================

/* ---------------- MAKEUP REQUEST ---------------- */

export const MakeupRequestTable = pgTable("makeup_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  original_session_date: date("original_session_date").notNull(),
  original_schedule_id: uuid("original_schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  reason: absenceReasonEnum("reason").notNull(),
  reason_text: text("reason_text"),
  preferred_dates: text("preferred_dates"),
  status: requestStatusEnum("status").notNull().default("pending"),
  requested_by: uuid("requested_by")
    .notNull()
    .references(() => UserTable.id),
  requested_at: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  reviewed_by: uuid("reviewed_by").references(() => UserTable.id),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  review_notes: text("review_notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- MAKEUP SESSION ---------------- */

export const MakeupSessionTable = pgTable("makeup_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  makeup_request_id: uuid("makeup_request_id").references(() => MakeupRequestTable.id),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  teacher_id: uuid("teacher_id")
    .notNull()
    .references(() => TeacherProfileTable.id),
  site_id: uuid("site_id")
    .notNull()
    .references(() => LocationTable.id),
  scheduled_date: date("scheduled_date").notNull(),
  scheduled_time: time("scheduled_time").notNull(),
  attendance_status: attendanceStatusEnum("attendance_status"),
  notes: text("notes"),
  created_by: uuid("created_by")
    .notNull()
    .references(() => UserTable.id),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== SCHEDULE CHANGE SYSTEM ====================

/* ---------------- SCHEDULE CHANGE REQUEST ---------------- */

export const ScheduleChangeRequestTable = pgTable("schedule_change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => StudentTable.id),
  current_schedule_id: uuid("current_schedule_id")
    .notNull()
    .references(() => ScheduleTable.id),
  requested_schedule_id: uuid("requested_schedule_id").references(() => ScheduleTable.id),
  preferred_times: text("preferred_times"),
  flexibility_notes: text("flexibility_notes"),
  reason: text("reason").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  requested_by: uuid("requested_by")
    .notNull()
    .references(() => UserTable.id),
  teacher_response_status: text("teacher_response_status"),
  teacher_response_notes: text("teacher_response_notes"),
  teacher_responded_by: uuid("teacher_responded_by").references(() => UserTable.id),
  teacher_responded_at: timestamp("teacher_responded_at", { withTimezone: true }),
  requested_at: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  reviewed_by: uuid("reviewed_by").references(() => UserTable.id),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  review_notes: text("review_notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ScheduleChangeRequestEventTable = pgTable("schedule_change_request_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  schedule_change_request_id: uuid("schedule_change_request_id")
    .notNull()
    .references(() => ScheduleChangeRequestTable.id),
  event_type: text("event_type").notNull(),
  from_status: text("from_status"),
  to_status: text("to_status"),
  actor_user_id: uuid("actor_user_id")
    .notNull()
    .references(() => UserTable.id),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== RELATIONS ====================

export const userRelations = relations(UserTable, ({ one }) => ({
  teacherProfile: one(TeacherProfileTable, {
    fields: [UserTable.id],
    references: [TeacherProfileTable.user_id],
  }),
  parentProfile: one(ParentProfileTable, {
    fields: [UserTable.id],
    references: [ParentProfileTable.user_id],
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

export const assessmentRelations = relations(AssessmentTable, ({ one }) => ({
  student: one(StudentTable, {
    fields: [AssessmentTable.student_id],
    references: [StudentTable.id],
  }),
  teacher: one(TeacherProfileTable, {
    fields: [AssessmentTable.teacher_id],
    references: [TeacherProfileTable.id],
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

export type SessionNoteEntity = typeof SessionNoteTable.$inferSelect;
export type SessionNoteInsert = typeof SessionNoteTable.$inferInsert;

export type AssessmentEntity = typeof AssessmentTable.$inferSelect;
export type AssessmentInsert = typeof AssessmentTable.$inferInsert;

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

export type ChatMessageEntity = typeof ChatMessageTable.$inferSelect;
export type ChatMessageInsert = typeof ChatMessageTable.$inferInsert;

export type MakeupRequestEntity = typeof MakeupRequestTable.$inferSelect;
export type MakeupRequestInsert = typeof MakeupRequestTable.$inferInsert;

export type MakeupSessionEntity = typeof MakeupSessionTable.$inferSelect;
export type MakeupSessionInsert = typeof MakeupSessionTable.$inferInsert;

export type ScheduleChangeRequestEntity = typeof ScheduleChangeRequestTable.$inferSelect;
export type ScheduleChangeRequestInsert = typeof ScheduleChangeRequestTable.$inferInsert;

export type ScheduleChangeRequestEventEntity = typeof ScheduleChangeRequestEventTable.$inferSelect;
export type ScheduleChangeRequestEventInsert = typeof ScheduleChangeRequestEventTable.$inferInsert;
