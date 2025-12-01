import { Body, Delete, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { StudentsService } from "../services/StudentsService";

@Service()
@JsonController("/v1")
export class GetStudentsController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Get("/students")
  async handle(@QueryParams() query: any) {
    return await this.studentsService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostStudentsController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Post("/students")
  async handle(@Body() body: any) {
    return await this.studentsService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class GetStudentController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Get("/students/:id")
  async handle(@Param("id") id: string) {
    return await this.studentsService.show(id);
  }
}

@Service()
@JsonController("/v1")
export class PatchStudentController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Patch("/students/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.studentsService.update(id, body);
  }
}

@Service()
@JsonController("/v1")
export class GetStudentTeachersController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Get("/students/:id/teachers")
  async handle(@Param("id") id: string, @QueryParams() query: any) {
    return await this.studentsService.teachers(id, query);
  }
}

@Service()
@JsonController("/v1")
export class PostStudentTeachersController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Post("/students/:id/teachers")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.studentsService.assignTeacher(id, body);
  }
}

@Service()
@JsonController("/v1")
export class DeleteStudentTeacherController {
  constructor(
    @Inject(() => StudentsService)
    private readonly studentsService: StudentsService
  ) {}

  @Delete("/students/:id/teachers/:teacherId")
  async handle(@Param("id") id: string, @Param("teacherId") teacherId: string) {
    return await this.studentsService.unassignTeacher(id, teacherId);
  }
}


