import { Get, JsonController, Param } from "routing-controllers";
import { Service, Inject } from "typedi";
import { ParentsService } from "../services/ParentsService";

@Service()
@JsonController("/v1")
export class GetParentsMeChildrenController {
  constructor(
    @Inject(() => ParentsService)
    private readonly parentsService: ParentsService
  ) {}

  @Get("/parents/me/children")
  async handle() {
    return await this.parentsService.myChildren();
  }
}

@Service()
@JsonController("/v1")
export class GetParentsChildDetailController {
  constructor(
    @Inject(() => ParentsService)
    private readonly parentsService: ParentsService
  ) {}

  @Get("/parents/children/:studentId")
  async handle(@Param("studentId") studentId: string) {
    return await this.parentsService.childDetail(studentId);
  }
}


