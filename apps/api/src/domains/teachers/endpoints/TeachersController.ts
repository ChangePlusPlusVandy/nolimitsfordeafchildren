import { Body, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { TeachersService } from "../services/TeachersService";

@Service()
@JsonController("/v1")
export class GetTeachersController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Get("/teachers")
  async handle(@QueryParams() query: any) {
    return await this.teachersService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostTeachersController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Post("/teachers")
  async handle(@Body() body: any) {
    return await this.teachersService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class GetTeacherController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Get("/teachers/:id")
  async handle(@Param("id") id: string) {
    return await this.teachersService.show(id);
  }
}

@Service()
@JsonController("/v1")
export class PatchTeacherController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Patch("/teachers/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.teachersService.update(id, body);
  }
}

@Service()
@JsonController("/v1")
export class GetTeacherStudentsController {
  constructor(
    @Inject(() => TeachersService)
    private readonly teachersService: TeachersService
  ) {}

  @Get("/teachers/:id/students")
  async handle(@Param("id") id: string, @QueryParams() query: any) {
    return await this.teachersService.students(id, query);
  }
}


