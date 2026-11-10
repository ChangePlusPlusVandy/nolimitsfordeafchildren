import { updateAnnouncement } from "../_announcement/service";
import { deleteMessage } from "../_delete/service";
import { listMessages } from "../_list/service";
import { createMessage } from "../_post/service";
import type { ChatChannel, CreateChatMessageInput } from "./types";

export type { ChatChannel, CreateChatMessageInput } from "./types";

export class ChatService {
  async listMessages(input: { channel: ChatChannel; page?: number; limit?: number }) {
    return listMessages(input);
  }

  async createMessage(input: CreateChatMessageInput) {
    return createMessage(input);
  }

  async updateAnnouncement(
    messageId: string,
    actorUserId: string,
    isAnnouncement: boolean,
    isAdmin: boolean,
  ) {
    return updateAnnouncement(messageId, actorUserId, isAnnouncement, isAdmin);
  }

  async deleteMessage(messageId: string, actorUserId: string): Promise<boolean> {
    return deleteMessage(messageId, actorUserId);
  }
}

export const chatService = new ChatService();
