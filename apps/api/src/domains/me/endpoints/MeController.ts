import {
  Body,
  Get,
  JsonController,
  Patch,
  Req,
  Authorized,
  NotFoundError,
} from "routing-controllers";
import type { Request } from "express";
import { Service } from "typedi";
import Container from "@/container";
import { MeService, type UpdateMeInput } from "../services/MeService";

/**
 * GET /v1/me
 * Get current user's profile
 */
@Service()
@JsonController("/v1")
export class GetMeController {
  private meService: MeService;
  constructor() {
    this.meService = Container.get(MeService);
  }

  @Get("/me")
  @Authorized()
  async handle(@Req() req: Request) {
    const currentUser = req.currentUser;

    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const profile = await this.meService.getProfile(currentUser.id);

    if (!profile) {
      throw new NotFoundError("User not found");
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      locale: profile.locale,
      role: profile.role,
      is_active: profile.is_active,
      created_at: profile.created_at,
      teacherProfileId: profile.teacherProfileId,
      parentProfileId: profile.parentProfileId,
    };
  }
}

/**
 * PATCH /v1/me
 * Update current user's profile
 */
@Service()
@JsonController("/v1")
export class PatchMeController {
  private meService: MeService;
  constructor() {
    this.meService = Container.get(MeService);
  }

  @Patch("/me")
  @Authorized()
  async handle(@Req() req: Request, @Body() body: UpdateMeInput) {
    const currentUser = req.currentUser;

    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    const updated = await this.meService.updateProfile(currentUser.id, body);

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      locale: updated.locale,
      role: updated.role,
      is_active: updated.is_active,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }
}
