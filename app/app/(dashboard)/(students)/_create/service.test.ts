import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { eq, inArray } from "drizzle-orm";
import { getPlatformProxy } from "wrangler";

import { markAttendance } from "@/(dashboard)/(attendance)/_mark/service";
import { getTeacherDaySessions } from "@/(dashboard)/(attendance)/_my-day/service";
import {
  getCurrentScheduleId,
  getNextSession,
} from "@/(dashboard)/(parents)/_children/schedule-sessions";
import { db, setDb } from "@/_platform/db";
import {
  AttendanceTable,
  EnrollmentTable,
  LocationTable,
  ScheduleTable,
  StudentTable,
  TeacherLocationTable,
  TeacherProfileTable,
  TeacherStudentTable,
  UserTable,
} from "@/_platform/db/schema";
import { todayStr } from "@/_shared/server/dates";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import { assertTeacherCanMarkStudentSchedule } from "../_access/service";
import { CreateStudentService } from "./service";

const siteId = crypto.randomUUID();
const userId = crypto.randomUUID();
const teacherId = crypto.randomUUID();
const scheduleId = crypto.randomUUID();
const studentIds: string[] = [];
const date = todayStr();
const input = { site_id: siteId, first_name: "Enrollment", last_name: "Test", dob: "2020-01-01" };
let proxy: Awaited<ReturnType<typeof getPlatformProxy<{ DB: D1Database }>>>;

before(async () => {
  proxy = await getPlatformProxy<{ DB: D1Database }>({
    configPath: "wrangler.jsonc",
    persist: true,
  });
  setDb(proxy.env.DB);
  await db.insert(LocationTable).values({
    id: siteId,
    name: "Enrollment test",
    type: "education_center",
    address_line1: "1 Test St",
    city: "Test",
    state: "CA",
    postal_code: "90001",
  });
  await db.insert(UserTable).values({
    id: userId,
    email: `${userId}@nolimits.test`,
    name: "Enrollment teacher",
    role: "teacher",
  });
  await db.insert(TeacherProfileTable).values({ id: teacherId, user_id: userId });
  await db
    .insert(TeacherLocationTable)
    .values({ teacher_profile_id: teacherId, location_id: siteId });
  await db.insert(ScheduleTable).values({
    id: scheduleId,
    teacher_id: teacherId,
    site_id: siteId,
    day_of_week_mask: 127,
    start_time: "09:00",
    end_time: "10:00",
    cycle_start_date: date,
    cycle_end_date: date,
  });
});

after(async () => {
  if (studentIds.length > 0) {
    await db.delete(AttendanceTable).where(inArray(AttendanceTable.student_id, studentIds));
    await db.delete(EnrollmentTable).where(inArray(EnrollmentTable.student_id, studentIds));
    await db.delete(TeacherStudentTable).where(inArray(TeacherStudentTable.student_id, studentIds));
  }
  await db.delete(StudentTable).where(eq(StudentTable.site_id, siteId));
  await db.delete(ScheduleTable).where(eq(ScheduleTable.id, scheduleId));
  await db
    .delete(TeacherLocationTable)
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherId));
  await db.delete(TeacherProfileTable).where(eq(TeacherProfileTable.id, teacherId));
  await db.delete(UserTable).where(eq(UserTable.id, userId));
  await db.delete(LocationTable).where(eq(LocationTable.id, siteId));
  await proxy.dispose();
});

test("initial enrollment reaches My Day and parent scheduling and permits teacher attendance", async () => {
  const student = await new CreateStudentService().create({
    ...input,
    initial_schedule_id: scheduleId,
  });
  studentIds.push(student.id);
  const enrollments = await db
    .select()
    .from(EnrollmentTable)
    .where(eq(EnrollmentTable.student_id, student.id));
  assert.equal(enrollments.length, 1);
  assert.equal(enrollments[0]?.ended_at, null);
  assert.equal(enrollments[0]?.schedule_id, scheduleId);
  assert.equal(await getCurrentScheduleId(student.id), scheduleId);
  assert.equal((await getNextSession(student.id))?.date, date);
  assert.equal(
    (await getTeacherDaySessions(teacherId, date)).some(
      (session) => session.student_id === student.id,
    ),
    true,
  );

  await assertTeacherCanMarkStudentSchedule(userId, student.id, scheduleId);
  const attendance = await markAttendance({
    student_id: student.id,
    schedule_id: scheduleId,
    session_date: date,
    status: "present",
    marked_by: userId,
  });
  assert.equal(attendance.status, "present");
  assert.equal(
    (await getTeacherDaySessions(teacherId, date)).find(
      (session) => session.student_id === student.id,
    )?.attendance?.id,
    attendance.id,
  );
});

test("creating without a schedule leaves the student unenrolled", async () => {
  const student = await new CreateStudentService().create(input);
  studentIds.push(student.id);
  assert.equal(await getCurrentScheduleId(student.id), null);
  assert.equal(
    (
      await db
        .select()
        .from(TeacherStudentTable)
        .where(eq(TeacherStudentTable.student_id, student.id))
    ).length,
    0,
  );
});

test("invalid schedules and removed teacher-site assignments fail before creating students", async () => {
  const service = new CreateStudentService();
  const beforeCount = (await db.select().from(StudentTable).where(eq(StudentTable.site_id, siteId)))
    .length;
  await assert.rejects(
    () => service.create({ ...input, initial_schedule_id: crypto.randomUUID() }),
    NotFoundError,
  );
  await assert.rejects(
    () => service.create({ ...input, site_id: "other-site", initial_schedule_id: scheduleId }),
    /student's site/,
  );
  await db.update(ScheduleTable).set({ is_active: false }).where(eq(ScheduleTable.id, scheduleId));
  await assert.rejects(
    () => service.create({ ...input, initial_schedule_id: scheduleId }),
    BadRequestError,
  );
  await db.update(ScheduleTable).set({ is_active: true }).where(eq(ScheduleTable.id, scheduleId));
  await db
    .delete(TeacherLocationTable)
    .where(eq(TeacherLocationTable.teacher_profile_id, teacherId));
  await assert.rejects(
    () => service.create({ ...input, initial_schedule_id: scheduleId }),
    /no longer assigned/,
  );
  assert.equal(
    (await db.select().from(StudentTable).where(eq(StudentTable.site_id, siteId))).length,
    beforeCount,
  );
});
