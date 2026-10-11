import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { type StudentEntity, StudentTable } from "@/_platform/db/schema";

import type { UpdateStudentInput } from "../_domain/types";

export class UpdateStudentService {
  private normalizeHearingDevices(input?: string[] | null): string[] {
    if (!input || input.length === 0) {
      return [];
    }

    return Array.from(
      new Set(input.map((value) => value.trim()).filter((value) => value.length > 0)),
    );
  }

  async update(id: string, data: UpdateStudentInput): Promise<StudentEntity | null> {
    const updatePayload: Record<string, unknown> = { ...data, updated_at: new Date() };

    if (data.hearing_devices !== undefined) {
      updatePayload.hearing_devices = this.normalizeHearingDevices(data.hearing_devices);
    }

    const [student] = await db
      .update(StudentTable)
      .set(updatePayload)
      .where(eq(StudentTable.id, id))
      .returning();

    return student || null;
  }
}
