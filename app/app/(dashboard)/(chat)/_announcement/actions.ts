"use server";

import { requireRole } from "@/_platform/auth/guard";
import { NotFoundError } from "@/_shared/server/errors";

import { chatService } from "../_domain/server";
import { announcementSchema } from "./validation";

export async function updateChatMessageAnnouncement(
  id: string,
  input: { is_announcement: boolean },
) {
  const currentUser = await requireRole("administrator", "teacher");
  const parsed = announcementSchema.parse(input);

  const updated = await chatService.updateAnnouncement(
    id,
    currentUser.id,
    Boolean(parsed.is_announcement),
    currentUser.role === "administrator",
  );

  if (!updated) {
    throw new NotFoundError("Message not found");
  }

  return updated;
}

export async function updateChatAnnouncement(id: string, input: { is_announcement: boolean }) {
  return await updateChatMessageAnnouncement(id, input);
}
