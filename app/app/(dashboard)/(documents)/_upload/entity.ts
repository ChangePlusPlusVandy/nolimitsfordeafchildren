import { eq } from "drizzle-orm";

import { db } from "@/_platform/db";
import { StudentTable, TeacherProfileTable } from "@/_platform/db/schema";
import { BadRequestError, NotFoundError } from "@/_shared/server/errors";

import type { EntityType } from "../_domain/types";

export async function validateEntity(entityType: EntityType, entityId: string): Promise<void> {
  if (entityType === "student") {
    const student = await db
      .select()
      .from(StudentTable)
      .where(eq(StudentTable.id, entityId))
      .limit(1);

    if (student.length === 0) {
      throw new NotFoundError("Student not found");
    }
  } else if (entityType === "teacher") {
    const teacher = await db
      .select()
      .from(TeacherProfileTable)
      .where(eq(TeacherProfileTable.id, entityId))
      .limit(1);

    if (teacher.length === 0) {
      throw new NotFoundError("Teacher not found");
    }
  } else {
    throw new BadRequestError("Invalid entity type");
  }
}
