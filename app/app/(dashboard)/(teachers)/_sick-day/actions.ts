"use server";

import { z } from "zod";

import { requireRole } from "@/_platform/auth/guard";

import { postSickDayNotice } from "./service";

const sickDaySchema = z
  .object({
    notice_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    note: z.string().max(2000).optional(),
    site_id: z.string().optional(),
  })
  .passthrough();

export async function postTeacherSickDayNotice(input: {
  notice_date?: string;
  note?: string;
  site_id?: string;
}) {
  const currentUser = await requireRole("teacher");
  const parsed = sickDaySchema.parse(input);
  return postSickDayNotice(currentUser, parsed);
}
