import { Body, JsonController, Post } from "routing-controllers";
import { Service, Inject } from "typedi";
import { AuthService } from "../services/AuthService";

@Service()
@JsonController("/v1")
export class PostAuthLoginController {
  constructor(
    @Inject(() => AuthService)
    private readonly authService: AuthService
  ) {}

  @Post("/auth/login")
  async handle(@Body() body: any) {
    return await this.authService.login(body);
  }
}

@Service()
@JsonController("/v1")
export class PostAuthRefreshController {
  constructor(
    @Inject(() => AuthService)
    private readonly authService: AuthService
  ) {}

  @Post("/auth/refresh")
  async handle(@Body() body: any) {
    return await this.authService.refresh(body);
  }
}

@Service()
@JsonController("/v1")
export class PostAuthLogoutController {
  constructor(
    @Inject(() => AuthService)
    private readonly authService: AuthService
  ) {}

  @Post("/auth/logout")
  async handle() {
    await this.authService.logout();
    return { status: 204 };
  }
}


