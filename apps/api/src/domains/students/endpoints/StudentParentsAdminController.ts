import { Body, Delete, Get, JsonController, Param, Post, Authorized } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { StudentsService, type LinkParentInput } from "../services/StudentsService";

@Service()
@JsonController("/v1/students")
export class StudentParentsAdminController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  // ==================== PARENTS ====================

  @Get("/:id/parents")
  @Authorized()
  async parents(@Param("id") id: string) {
    return await this.studentsService.parents(id);
  }

  @Post("/:id/parents")
  @Authorized(["administrator"])
  async addParent(@Param("id") id: string, @Body() body: LinkParentInput) {
    return await this.studentsService.linkParent(
      id,
      body.parent_id,
      body.relationship,
      body.is_primary,
    );
  }

  @Delete("/:id/parents/:parentId")
  @Authorized(["administrator"])
  async removeParent(@Param("id") id: string, @Param("parentId") parentId: string) {
    return await this.studentsService.unlinkParent(id, parentId);
  }
}
