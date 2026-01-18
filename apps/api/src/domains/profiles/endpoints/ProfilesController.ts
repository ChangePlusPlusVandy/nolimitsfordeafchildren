import { Body, Get, JsonController, Param, Patch } from "routing-controllers";
import { Service, Inject } from "typedi";
import { ProfilesService } from "../services/ProfilesService";

@Service()
@JsonController("/v1/profiles")
export class ProfilesController {
  constructor(
    @Inject(() => ProfilesService)
    private readonly profilesService: ProfilesService
  ) {}

  @Get("/teacher/:userId")
  async getTeacher(@Param("userId") userId: string) {
    return await this.profilesService.getTeacher(userId);
  }

  @Patch("/teacher/:userId")
  async updateTeacher(@Param("userId") userId: string, @Body() body: any) {
    return await this.profilesService.updateTeacher(userId, body);
  }

  @Get("/parent/:userId")
  async getParent(@Param("userId") userId: string) {
    return await this.profilesService.getParent(userId);
  }

  @Patch("/parent/:userId")
  async updateParent(@Param("userId") userId: string, @Body() body: any) {
    return await this.profilesService.updateParent(userId, body);
  }
}




