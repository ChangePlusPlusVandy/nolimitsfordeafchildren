import {
  Authorized,
  Body,
  CurrentUser,
  Delete,
  Get,
  HttpError,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { ChatService, type ChatChannel } from "../services/ChatService";
import type { UserEntity } from "@/db/schema";

interface CreateChatMessageBody {
  channel: ChatChannel;
  message: string;
  is_announcement?: boolean;
}

interface PatchAnnouncementBody {
  is_announcement: boolean;
}

@Service()
@JsonController("/v1")
export class GetChatMessagesController {
  private chatService: ChatService;

  constructor() {
    this.chatService = Container.get(ChatService);
  }

  @Get("/chat/messages")
  @Authorized(["administrator", "teacher"])
  async handle(
    @QueryParam("channel") channel: ChatChannel = "community",
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    if (channel !== "community" && channel !== "teacher") {
      throw new HttpError(400, "Invalid channel");
    }

    return await this.chatService.listMessages({ channel, page, limit });
  }
}

@Service()
@JsonController("/v1")
export class PostChatMessageController {
  private chatService: ChatService;

  constructor() {
    this.chatService = Container.get(ChatService);
  }

  @Post("/chat/messages")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Body() body: CreateChatMessageBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    if (!body.channel || !body.message) {
      throw new HttpError(400, "channel and message are required");
    }

    try {
      return await this.chatService.createMessage({
        channel: body.channel,
        message: body.message,
        is_announcement: body.is_announcement,
        created_by: currentUser.id,
      });
    } catch (error: any) {
      if (error.message?.includes("cannot be empty")) {
        throw new HttpError(422, error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class PatchChatMessageAnnouncementController {
  private chatService: ChatService;

  constructor() {
    this.chatService = Container.get(ChatService);
  }

  @Patch("/chat/messages/:id/announcement")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Param("id") id: string,
    @Body() body: PatchAnnouncementBody,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    try {
      const updated = await this.chatService.updateAnnouncement(
        id,
        currentUser.id,
        Boolean(body.is_announcement),
        currentUser.role === "administrator",
      );

      if (!updated) {
        throw new HttpError(404, "Message not found");
      }

      return updated;
    } catch (error: any) {
      if (error.message?.includes("Only the message author")) {
        throw new HttpError(403, error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class DeleteChatMessageController {
  private chatService: ChatService;

  constructor() {
    this.chatService = Container.get(ChatService);
  }

  @Delete("/chat/messages/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @CurrentUser({ required: true }) currentUser: UserEntity) {
    const deleted = await this.chatService.deleteMessage(id, currentUser.id);
    if (!deleted) {
      throw new HttpError(404, "Message not found");
    }

    return { ok: true };
  }
}
