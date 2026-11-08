"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import { endEnrollment as end, reenrollStudent as reenroll } from "./service";

const idSchema = z.string().min(1);

export async function endEnrollment(scheduleId: string, enrollmentId: string) {
  await requireRole("administrator");
  return await end(idSchema.parse(scheduleId), idSchema.parse(enrollmentId));
}

export async function reenrollStudent(scheduleId: string, studentId: string) {
  await requireRole("administrator");
  return await reenroll(idSchema.parse(scheduleId), idSchema.parse(studentId));
}
