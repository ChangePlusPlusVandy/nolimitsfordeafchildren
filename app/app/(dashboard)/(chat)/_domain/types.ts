export type ChatChannel = "community" | "teacher";

export interface CreateChatMessageInput {
  channel: ChatChannel;
  message: string;
  is_announcement?: boolean;
  created_by: string;
}

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
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
