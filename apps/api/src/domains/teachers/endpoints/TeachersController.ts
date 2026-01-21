import { Body, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { Authorized } from "routing-controllers";
import { TeachersService, type ListTeachersQuery, type CreateTeacherInput, type UpdateTeacherInput } from "../services/TeachersService";

@Service()
@JsonController("/v1")
export class GetTeachersController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Get("/teachers")
  @Authorized(["administrator"])
  async handle(@QueryParams() query: ListTeachersQuery) {
    return await this.teachersService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostTeachersController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Post("/teachers")
  @Authorized(["administrator"])
  async handle(@Body() body: CreateTeacherInput) {
    return await this.teachersService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class GetTeacherController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Get("/teachers/:id")
  async handle(@Param("id") id: string) {
    const teacher = await this.teachersService.show(id);
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    return teacher;
  }
}

@Service()
@JsonController("/v1")
export class PatchTeacherController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Patch("/teachers/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateTeacherInput) {
    const teacher = await this.teachersService.update(id, body);
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    return teacher;
  }
}

@Service()
@JsonController("/v1")
export class GetTeacherStudentsController {
  private teachersService: TeachersService;
  constructor() {
    this.teachersService = Container.get(TeachersService);
  }

  @Get("/teachers/:id/students")
  async handle(@Param("id") id: string, @QueryParams() query: { page?: number; limit?: number }) {
    return await this.teachersService.students(id, query);
  }
}
