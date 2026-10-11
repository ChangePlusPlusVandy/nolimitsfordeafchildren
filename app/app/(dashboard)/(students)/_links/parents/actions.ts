"use server";

import { requireRole } from "@/_platform/auth/guard";

import { linkParent, unlinkParent } from "./service";
import { linkParentSchema } from "./validation";

export async function linkStudentParent(
  id: string,
  input: { parent_id: string; relationship?: string | null; is_primary?: boolean },
) {
  await requireRole("administrator");
  const parsed = linkParentSchema.parse(input);
  return await linkParent(
    id,
    parsed.parent_id,
    parsed.relationship ?? undefined,
    parsed.is_primary,
  );
}

export async function unlinkStudentParent(id: string, parentId: string) {
  await requireRole("administrator");
  return await unlinkParent(id, parentId);
}
