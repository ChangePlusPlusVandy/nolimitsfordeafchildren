import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  CurrentUser,
  Authorized,
  NotFoundError,
  BadRequestError,
  HttpCode,
} from "routing-controllers";
import type { Request } from "express";
import { Service } from "typedi";
import Container from "@/container";
import {
  BulletinsService,
  type ListBulletinsQuery,
  type CreateBulletinInput,
  type UpdateBulletinInput,
  type AddAttachmentInput,
  type AcknowledgeBulletinInput,
  type GetBulletinAttachmentUploadUrlInput,
  type BulletinScope,
  type BulletinRoleTarget,
} from "../services/BulletinsService";
import type { UserEntity } from "@/db/schema";

/**
 * GET /v1/bulletins
 * List bulletins filtered by user's role and site
 * All authenticated users can access this endpoint
 */
@Service()
@JsonController("/v1")
export class GetBulletinsController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Get("/bulletins")
  @Authorized()
  async handle(
    @Req() req: Request,
    @QueryParam("siteId") siteId?: string,
    @QueryParam("scope") scope?: BulletinScope,
    @QueryParam("roleTarget") roleTarget?: BulletinRoleTarget,
    @QueryParam("includeExpired") includeExpired?: boolean,
    @QueryParam("includeScheduled") includeScheduled?: boolean,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const query: ListBulletinsQuery = {
      siteId,
      scope,
      roleTarget,
      includeExpired,
      includeScheduled,
      page,
      limit,
    };
    return await this.bulletinsService.index(query, currentUser.role, currentUser.id);
  }
}

/**
 * GET /v1/bulletins/:id
 * Get a single bulletin by ID
 * All authenticated users can access this endpoint
 */
@Service()
@JsonController("/v1")
export class GetBulletinController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Get("/bulletins/:id")
  @Authorized()
  async handle(
    @Param("id") id: string,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const bulletin = await this.bulletinsService.show(id, currentUser.id);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }

    await this.bulletinsService.recordView(id, currentUser.id);

    return bulletin;
  }
}

@Service()
@JsonController("/v1")
export class GetBulletinViewsController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Get("/bulletins/:id/views")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const bulletin = await this.bulletinsService.show(id);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }

    return await this.bulletinsService.getViewStats(id);
  }
}

/**
 * POST /v1/bulletins
 * Create a new bulletin
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PostBulletinsController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Post("/bulletins")
  @Authorized(["administrator"])
  @HttpCode(201)
  async handle(@Req() req: Request, @Body() body: CreateBulletinInput) {
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    // Validate required fields
    if (!body.title || !body.title.trim()) {
      throw new BadRequestError("Title is required");
    }

    if (!body.scope || !["global", "site"].includes(body.scope)) {
      throw new BadRequestError("Scope must be 'global' or 'site'");
    }

    if (body.scope === "site" && !body.site_id) {
      throw new BadRequestError("site_id is required when scope is 'site'");
    }

    if (
      !body.role_target ||
      !["all", "administrator", "teacher", "parent"].includes(body.role_target)
    ) {
      throw new BadRequestError(
        "role_target must be 'all', 'administrator', 'teacher', or 'parent'",
      );
    }

    return await this.bulletinsService.create(body, currentUser.id);
  }
}

/**
 * PATCH /v1/bulletins/:id
 * Update a bulletin
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PatchBulletinController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Patch("/bulletins/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateBulletinInput) {
    // Validate scope if provided
    if (body.scope && !["global", "site"].includes(body.scope)) {
      throw new BadRequestError("Scope must be 'global' or 'site'");
    }

    // Validate role_target if provided
    if (
      body.role_target &&
      !["all", "administrator", "teacher", "parent"].includes(body.role_target)
    ) {
      throw new BadRequestError(
        "role_target must be 'all', 'administrator', 'teacher', or 'parent'",
      );
    }

    const bulletin = await this.bulletinsService.update(id, body);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }
    return bulletin;
  }
}

/**
 * DELETE /v1/bulletins/:id
 * Delete a bulletin
 * Admin only
 */
@Service()
@JsonController("/v1")
export class DeleteBulletinController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Delete("/bulletins/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const deleted = await this.bulletinsService.delete(id);
    if (!deleted) {
      throw new NotFoundError("Bulletin not found");
    }
    return { success: true, message: "Bulletin deleted" };
  }
}

/**
 * POST /v1/bulletins/:id/attachments
 * Add an attachment to a bulletin
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PostBulletinAttachmentController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Post("/bulletins/:id/attachments")
  @Authorized(["administrator"])
  @HttpCode(201)
  async handle(@Param("id") id: string, @Body() body: AddAttachmentInput) {
    if (!body.file_url || !body.file_name) {
      throw new BadRequestError("file_url and file_name are required");
    }

    try {
      return await this.bulletinsService.addAttachment(id, body);
    } catch (error) {
      if (error instanceof Error && error.message === "Bulletin not found") {
        throw new NotFoundError("Bulletin not found");
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class PostBulletinAttachmentUploadUrlController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Post("/bulletins/attachments/upload-url")
  @Authorized(["administrator"])
  async handle(
    @Body() body: GetBulletinAttachmentUploadUrlInput,
  ) {
    if (!body.file_name || !body.content_type) {
      throw new BadRequestError("file_name and content_type are required");
    }

    try {
      return await this.bulletinsService.getAttachmentUploadUrl(body);
    } catch (error) {
      throw error;
    }
  }
}

/**
 * DELETE /v1/bulletins/:id/attachments/:attachmentId
 * Delete an attachment from a bulletin
 * Admin only
 */
@Service()
@JsonController("/v1")
export class DeleteBulletinAttachmentController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Delete("/bulletins/:id/attachments/:attachmentId")
  @Authorized(["administrator"])
  async handle(@Param("id") _id: string, @Param("attachmentId") attachmentId: string) {
    const deleted = await this.bulletinsService.deleteAttachment(attachmentId);
    if (!deleted) {
      throw new NotFoundError("Attachment not found");
    }
    return { success: true, message: "Attachment deleted" };
  }
}

@Service()
@JsonController("/v1")
export class PostBulletinAcknowledgeController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Post("/bulletins/:id/acknowledge")
  @Authorized(["parent"])
  async handle(
    @Param("id") id: string,
    @Body() body: AcknowledgeBulletinInput,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    if (!body.initials || !body.initials.trim()) {
      throw new BadRequestError("initials are required");
    }

    try {
      return await this.bulletinsService.acknowledgeBulletin(id, currentUser.id, body);
    } catch (error) {
      if (error instanceof Error && error.message === "Bulletin not found") {
        throw new NotFoundError("Bulletin not found");
      }
      if (error instanceof Error && error.message.includes("Initials")) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class GetBulletinAcknowledgementsController {
  private bulletinsService: BulletinsService;
  constructor() {
    this.bulletinsService = Container.get(BulletinsService);
  }

  @Get("/bulletins/:id/acknowledgements")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const bulletin = await this.bulletinsService.show(id);
    if (!bulletin) {
      throw new NotFoundError("Bulletin not found");
    }

    return await this.bulletinsService.getAcknowledgementStats(id);
  }
}
