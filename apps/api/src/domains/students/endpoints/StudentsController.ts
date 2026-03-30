import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
  CurrentUser,
  NotFoundError,
  Authorized,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  StudentsService,
  type StudentFilters,
  type CreateStudentInput,
  type UpdateStudentInput,
  type AddSiblingInput,
  type UpdateSiblingInput,
} from "../services/StudentsService";

// Type for current user from auth
interface CurrentUserType {
  id: string;
  role: "administrator" | "teacher" | "parent";
}

// ==================== LIST STUDENTS ====================

@Service()
@JsonController("/v1")
export class GetStudentsController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Get("/students")
  @Authorized()
  async handle(
    @QueryParam("search") search?: string,
    @QueryParam("site_id") site_id?: string,
    @QueryParam("is_active") is_active?: boolean,
    @QueryParam("limit") limit?: number,
    @QueryParam("cursor") cursor?: string,
    @CurrentUser() user?: CurrentUserType,
  ) {
    const query: StudentFilters = { search, site_id, is_active, limit, cursor };
    const role = user?.role ?? "administrator";
    const userId = user?.id;
    return await this.studentsService.index(query, role, userId);
  }
}

// ==================== CREATE STUDENT ====================

@Service()
@JsonController("/v1")
export class PostStudentsController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Post("/students")
  @Authorized(["administrator"])
  async handle(@Body() body: CreateStudentInput) {
    return await this.studentsService.create(body);
  }
}

// ==================== GET STUDENT DETAILS ====================

@Service()
@JsonController("/v1")
export class GetStudentController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Get("/students/:id")
  @Authorized()
  async handle(@Param("id") id: string, @CurrentUser() user?: CurrentUserType) {
    const student = await this.studentsService.show(id, user);
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    return student;
  }
}

// ==================== UPDATE STUDENT ====================

@Service()
@JsonController("/v1")
export class PatchStudentController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Patch("/students/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateStudentInput) {
    const student = await this.studentsService.update(id, body);
    if (!student) {
      throw new NotFoundError("Student not found");
    }
    return student;
  }
}

// ==================== STUDENT TEACHERS ====================

@Service()
@JsonController("/v1")
export class GetStudentTeachersController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Get("/students/:id/teachers")
  @Authorized()
  async handle(
    @Param("id") id: string,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
  ) {
    return await this.studentsService.teachers(id, { page, limit });
  }
}

@Service()
@JsonController("/v1")
export class PostStudentTeachersController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Post("/students/:id/teachers")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: { teacher_id: string }) {
    return await this.studentsService.linkTeacher(id, body.teacher_id);
  }
}

@Service()
@JsonController("/v1")
export class DeleteStudentTeacherController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Delete("/students/:id/teachers/:teacherId")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Param("teacherId") teacherId: string) {
    return await this.studentsService.unlinkTeacher(id, teacherId);
  }
}

// ==================== SIBLINGS ====================

@Service()
@JsonController("/v1")
export class PostStudentSiblingsController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Post("/students/:id/siblings")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: AddSiblingInput) {
    return await this.studentsService.addSibling(id, body);
  }
}

@Service()
@JsonController("/v1")
export class PatchSiblingController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Patch("/siblings/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateSiblingInput) {
    const sibling = await this.studentsService.updateSibling(id, body);
    if (!sibling) {
      throw new NotFoundError("Sibling not found");
    }
    return sibling;
  }
}

@Service()
@JsonController("/v1")
export class DeleteSiblingController {
  private studentsService: StudentsService;
  constructor() {
    this.studentsService = Container.get(StudentsService);
  }

  @Delete("/siblings/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    return await this.studentsService.removeSibling(id);
  }
}
