"use server";

import { staffByLocation } from "@/(dashboard)/(locations)/_domain/queries";
import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { myChildren as readChildren, childDetail as readChild } from "./service";

export async function myChildren(query: { page?: number; limit?: number } = {}) {
  const user = await requireRole("parent");
  return await readChildren(user.id, query);
}

export async function childDetail(studentId: string) {
  const user = await requireRole("parent");
  const result = await readChild(user.id, studentId);
  if (!result) {
    throw new NotFoundError("Student not found or access denied");
  }
  return result;
}

export async function getMyChildren(query: { page?: number; limit?: number } = {}) {
  return await myChildren(query);
}

export async function getChildDetails(studentId: string) {
  return await childDetail(studentId);
}

export async function getLocationStaff(siteId: string) {
  return staffByLocation(siteId);
}
