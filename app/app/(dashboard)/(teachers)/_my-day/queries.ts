"use server";

import { requireRole } from "@/_platform/auth/guard";

import { getMyDayForUser } from "./service";

export async function getTeachersMeDay(query: {
  date?: string;
  start_date?: string;
  end_date?: string;
}) {
  const currentUser = await requireRole("teacher");
  return getMyDayForUser(currentUser.id, query);
}

export async function getTeacherMyDay(query: {
  date?: string;
  start_date?: string;
  end_date?: string;
}) {
  return await getTeachersMeDay(query);
}
