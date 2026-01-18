import { Body, Delete, Get, JsonController, Param, Post } from "routing-controllers";
import { Service, Inject } from "typedi";
import { StudentsService } from "../services/StudentsService";

@Service()
@JsonController("/v1/students")
export class StudentParentsAdminController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Get("/:id/parents")
  async parents(@Param("id") id: string) {
    return await this.studentsService.parents(id);
  }

  @Post("/:id/parents")
  async addParent(@Param("id") id: string, @Body() body: any) {
    return await this.studentsService.addParent(id, body);
  }

  @Delete("/:id/parents/:parentId")
  async removeParent(@Param("id") id: string, @Param("parentId") parentId: string) {
    return await this.studentsService.removeParent(id, parentId);
  }
}




