import { db } from "@/_platform/db";
import { type StudentEntity, StudentTable } from "@/_platform/db/schema";

import type { CreateStudentInput } from "../_domain/types";

export class CreateStudentService {
  private normalizeHearingDevices(input?: string[] | null): string[] {
    if (!input || input.length === 0) {
      return [];
    }

    return Array.from(
      new Set(input.map((value) => value.trim()).filter((value) => value.length > 0)),
    );
  }

  async create(data: CreateStudentInput): Promise<StudentEntity> {
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

    return student;
  }
}
