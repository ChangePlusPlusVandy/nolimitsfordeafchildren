/**
 * Thin client data-access layer for Staff Chat.
 *
 * Names reconcile 1:1 with `src/server/chat/{queries,actions}.ts`.
 */

import {
  createChatMessage as serverCreateChatMessage,
  deleteChatMessage as serverDeleteChatMessage,
  updateChatMessageAnnouncement as serverUpdateChatMessageAnnouncement,
} from "@/server/chat/actions";
import { listChatMessages as serverListChatMessages } from "@/server/chat/queries";

export type { ChatChannel, CreateChatMessageInput } from "@/server/chat/service";

export interface ChatMessage {
  id: string;
  channel: import("@/server/chat/service").ChatChannel;
  message: string;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user: {
    id: string;
    name: string;
    role: "administrator" | "teacher" | "parent" | "unassigned";
  };
}

export interface ListChatMessagesResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listChatMessages(
  channel: import("@/server/chat/service").ChatChannel,
  params?: { page?: number; limit?: number },
): Promise<ListChatMessagesResponse> {
  return serverListChatMessages({ channel, ...params }) as never;
}

export async function createChatMessage(input: {
  channel: import("@/server/chat/service").ChatChannel;
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
