import { Body, Delete, Get, JsonController, Param, Patch, Post, QueryParams } from "routing-controllers";
import { Service, Inject } from "typedi";
import { BulletinsService } from "../services/BulletinsService";

@Service()
@JsonController("/v1")
export class GetBulletinsController {
  constructor(
    @Inject(() => BulletinsService)
    private readonly bulletinsService: BulletinsService
  ) {}

  @Get("/bulletins")
  async handle(@QueryParams() query: any) {
    return await this.bulletinsService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostBulletinsController {
  constructor(
    @Inject(() => BulletinsService)
    private readonly bulletinsService: BulletinsService
  ) {}

  @Post("/bulletins")
  async handle(@Body() body: any) {
    return await this.bulletinsService.create(body);
  }
}

@Service()
@JsonController("/v1")
export class PatchBulletinController {
  constructor(
    @Inject(() => BulletinsService)
    private readonly bulletinsService: BulletinsService
  ) {}

  @Patch("/bulletins/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.bulletinsService.update(id, body);
  }
}

@Service()
@JsonController("/v1")
export class DeleteBulletinController {
  constructor(
    @Inject(() => BulletinsService)
    private readonly bulletinsService: BulletinsService
  ) {}

  @Delete("/bulletins/:id")
  async handle(@Param("id") id: string) {
    await this.bulletinsService.remove(id);
    return { status: 204 }
  }
}


