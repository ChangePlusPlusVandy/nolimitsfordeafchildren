import { updateChatMessageAnnouncement as serverUpdateChatMessageAnnouncement } from "../_announcement/actions";
import { deleteChatMessage as serverDeleteChatMessage } from "../_delete/actions";
import { listChatMessages as serverListChatMessages } from "../_list/queries";
import { createChatMessage as serverCreateChatMessage } from "../_post/actions";
import type { ListChatMessagesResponse } from "./types";

export type * from "./types";

export async function listChatMessages(
  channel: import("./types").ChatChannel,
  params?: { page?: number; limit?: number },
): Promise<ListChatMessagesResponse> {
  return serverListChatMessages({ channel, ...params }) as never;
}

export async function createChatMessage(input: {
  channel: import("./types").ChatChannel;
  message: string;
  is_announcement?: boolean;
}) {
  return serverCreateChatMessage(input);
}

export async function updateChatAnnouncement(input: { id: string; is_announcement: boolean }) {
  return serverUpdateChatMessageAnnouncement(input.id, { is_announcement: input.is_announcement });
}

export async function deleteChatMessage(messageId: string) {
  return serverDeleteChatMessage(messageId);
}
