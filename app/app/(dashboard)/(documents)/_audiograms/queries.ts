"use server";

import { requireRole } from "@/_platform/auth/guard";

import { documentsService } from "../_domain/server";

export async function overdueAudiograms(query: { page?: number; limit?: number } = {}) {
  await requireRole("administrator");
  return await documentsService.getOverdueAudiograms(0, query);
}

export async function audiogramsDueSoon(
  query: { days?: number; page?: number; limit?: number } = {},
) {
  await requireRole("administrator");
  const days = query.days || 30;
  return await documentsService.getAudiogramsDueSoon(days, {
    page: query.page,
    limit: query.limit,
  });
}
