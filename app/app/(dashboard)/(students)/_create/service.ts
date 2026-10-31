import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/_platform/db";
import {
  EnrollmentTable,
  type StudentEntity,
  StudentTable,
  ScheduleTable,
} from "@/_platform/db/schema";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/_shared/server/errors";

import type { CreateStudentInput } from "../_domain/types";

export class CreateStudentService {
  private normalizeHearingDevices(input?: string[] | null): string[] {
    if (!input || input.length === 0) {
      return [];
    }

    return Array.from(
      new Set(
        input.map((value) => value.trim()).filter((value) => value.length > 0),
      ),
    );
  }

  async create(data: CreateStudentInput): Promise<StudentEntity> {
    if (data.initial_schedule_id) {
      await this.validateSchedule(data.initial_schedule_id, data.site_id);
    }

    const initials =
      data.initials?.trim() ||
      `${data.first_name.trim().charAt(0)}${data.last_name.trim().charAt(0)}`.toUpperCase();
    const [student] = await db
      .insert(StudentTable)
      .values({
        site_id: data.site_id,
        first_name: data.first_name,
        last_name: data.last_name,
        initials,
        photo_url: data.photo_url,
        dob: data.dob,
        current_school: data.current_school,
        preferred_language: data.preferred_language || "English",
        hearing_devices: this.normalizeHearingDevices(data.hearing_devices),
        hearing_loss_type: data.hearing_loss_type ?? null,
        guardian_summary: data.guardian_summary,
      })
      .returning();

    if (!student) {
      throw new Error("Failed to create student");
    }

    if (data.initial_schedule_id) {
      await this.enrollStudent(student.id, data.initial_schedule_id);
    }

    return student;
  }

  private async validateSchedule(
    scheduleId: string,
    siteId: string,
  ): Promise<void> {
    const [schedule] = await db
      .select()
      .from(ScheduleTable)
      .where(eq(ScheduleTable.id, scheduleId))
      .limit(1);

    if (!schedule) {
      throw new NotFoundError("Schedule not found");
    }

    if (!schedule.is_active) {
      throw new BadRequestError("Cannot enroll in an inactive schedule");
    }

    if (schedule.site_id !== siteId) {
      throw new BadRequestError(
        "Schedule does not belong to the student's site",
      );
    }
  }

  private async enrollStudent(
    studentId: string,
    scheduleId: string,
  ): Promise<void> {
    const existing = await db
      .select()
      .from(EnrollmentTable)
      .where(
        and(
          eq(EnrollmentTable.student_id, studentId),
          eq(EnrollmentTable.schedule_id, scheduleId),
          isNull(EnrollmentTable.ended_at),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError(
        "Student is already actively enrolled in this schedule",
      );
    }

    await db.insert(EnrollmentTable).values({
      student_id: studentId,
      schedule_id: scheduleId,
      enrolled_at: new Date(),
    });
  }
}
