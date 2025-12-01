import { Body, Get, JsonController, Patch, Post, QueryParams, Param } from "routing-controllers";
import { Service, Inject } from "typedi";
import { UsersService } from "../services/UsersService";

@Service()
@JsonController("/v1")
export class GetUsersController {
  constructor(
    @Inject(() => UsersService)
    private readonly usersService: UsersService
  ) {}

  @Get("/users")
  async handle(@QueryParams() query: any) {
    return await this.usersService.index(query);
  }
}

@Service()
@JsonController("/v1")
export class PostUsersInviteController {
  constructor(
    @Inject(() => UsersService)
    private readonly usersService: UsersService
  ) {}

  @Post("/users/invite")
  async handle(@Body() body: any) {
    return await this.usersService.invite(body);
  }
}

@Service()
@JsonController("/v1")
export class PatchUserController {
  constructor(
    @Inject(() => UsersService)
    private readonly usersService: UsersService
  ) {}

  @Patch("/users/:id")
  async handle(@Param("id") id: string, @Body() body: any) {
    return await this.usersService.update(id, body);
  }
}


