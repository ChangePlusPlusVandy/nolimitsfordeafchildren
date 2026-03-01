import {
  Body,
  Get,
  JsonController,
  Param,
  Patch,
  Authorized,
  CurrentUser,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { ProfilesService } from "../services/ProfilesService";
import { ForbiddenError } from "routing-controllers";

interface CurrentUserType {
  id: string;
  role: "administrator" | "teacher" | "parent";
}

@Service()
@JsonController("/v1/profiles")
export class ProfilesController {
  private profilesService: ProfilesService;
  constructor() {
    this.profilesService = Container.get(ProfilesService);
  }

  @Get("/teacher/:userId")
  @Authorized(["administrator", "teacher"])
  async getTeacher(@Param("userId") userId: string, @CurrentUser() currentUser: CurrentUserType) {
    // Teachers can only view their own profile, admins can view any
    if (currentUser.role === "teacher" && currentUser.id !== userId) {
      throw new ForbiddenError("You can only view your own profile");
    }
    return await this.profilesService.getTeacher(userId);
  }

  @Patch("/teacher/:userId")
  @Authorized(["administrator", "teacher"])
  async updateTeacher(
    @Param("userId") userId: string,
    @Body() body: any,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // Teachers can only update their own profile, admins can update any
    if (currentUser.role === "teacher" && currentUser.id !== userId) {
      throw new ForbiddenError("You can only update your own profile");
    }
    return await this.profilesService.updateTeacher(userId, body);
  }

  @Get("/parent/:userId")
  @Authorized(["administrator", "parent"])
  async getParent(@Param("userId") userId: string, @CurrentUser() currentUser: CurrentUserType) {
    // Parents can only view their own profile, admins can view any
    if (currentUser.role === "parent" && currentUser.id !== userId) {
      throw new ForbiddenError("You can only view your own profile");
    }
    return await this.profilesService.getParent(userId);
  }

  @Patch("/parent/:userId")
  @Authorized(["administrator", "parent"])
  async updateParent(
    @Param("userId") userId: string,
    @Body() body: any,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // Parents can only update their own profile, admins can update any
    if (currentUser.role === "parent" && currentUser.id !== userId) {
      throw new ForbiddenError("You can only update your own profile");
    }
    return await this.profilesService.updateParent(userId, body);
  }
}
