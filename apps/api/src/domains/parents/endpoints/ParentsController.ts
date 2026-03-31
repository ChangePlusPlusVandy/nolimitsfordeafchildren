import { Get, JsonController, Param, CurrentUser, Authorized } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { ParentsService } from "../services/ParentsService";
import type { UserEntity } from "@/db/schema";

@Service()
@JsonController("/v1")
export class GetParentsMeChildrenController {
  private parentsService: ParentsService;
  constructor() {
    this.parentsService = Container.get(ParentsService);
  }

  /**
   * Get children linked to the current parent
   * GET /v1/parents/me/children
   */
  @Get("/parents/me/children")
  @Authorized(["parent"])
  async handle(@CurrentUser({ required: true }) currentUser: UserEntity) {
    return await this.parentsService.myChildren(currentUser.id);
  }
}

@Service()
@JsonController("/v1")
export class GetParentsChildDetailController {
  private parentsService: ParentsService;
  constructor() {
    this.parentsService = Container.get(ParentsService);
  }

  /**
   * Get detailed view of a specific child
   * GET /v1/parents/children/:studentId
   */
  @Get("/parents/children/:studentId")
  @Authorized(["parent"])
  async handle(
    @Param("studentId") studentId: string,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    const result = await this.parentsService.childDetail(currentUser.id, studentId);
    if (!result) {
      throw new Error("Student not found or access denied");
    }
    return result;
  }
}

@Service()
@JsonController("/v1")
export class GetParentsDirectoryController {
  private parentsService: ParentsService;
  constructor() {
    this.parentsService = Container.get(ParentsService);
  }

  /**
   * Get admin/teacher directory visible to current parent
   * GET /v1/parents/directory
   */
  @Get("/parents/directory")
  @Authorized(["parent"])
  async handle(@CurrentUser({ required: true }) currentUser: UserEntity) {
    return await this.parentsService.directory(currentUser.id);
  }
}

@Service()
@JsonController("/v1")
export class GetParentsZipReportController {
  private parentsService: ParentsService;
  constructor() {
    this.parentsService = Container.get(ParentsService);
  }

  /**
   * Get parent zip-code report for grant reporting
   * GET /v1/parents/zip-report
   */
  @Get("/parents/zip-report")
  @Authorized(["administrator"])
  async handle() {
    return await this.parentsService.zipReport();
  }
}
