"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import type { AddSiblingInput, UpdateSiblingInput } from "../_domain/types";
import * as siblings from "./service";
import { siblingSchema } from "./validation";

export async function addSibling(id: string, input: AddSiblingInput) {
  await requireRole("administrator");
  const parsed = siblingSchema.parse(input) as AddSiblingInput;
  return await siblings.addSibling(id, parsed);
}

export async function updateSibling(id: string, input: UpdateSiblingInput) {
  await requireRole("administrator");
  const parsed = siblingSchema.partial().parse(input) as UpdateSiblingInput;
  const sibling = await siblings.updateSibling(id, parsed);
  if (!sibling) {
    throw new NotFoundError("Sibling not found");
  }
  return sibling;
}

export async function removeSibling(id: string) {
  await requireRole("administrator");
  return await siblings.removeSibling(id);
}
