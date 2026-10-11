"use server";

import { StudentsService } from "@/(dashboard)/(students)/_domain/server";
import { requireRole } from "@/_platform/auth/guard";

export async function getUserStudents(
  query: { search?: string; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  return await new StudentsService().index(query, "administrator", undefined);
}
