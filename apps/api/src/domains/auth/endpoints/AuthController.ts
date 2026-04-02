import { Get, JsonController, Req, Authorized } from "routing-controllers";
import { Service } from "typedi";
import type { Request } from "express";

@Service()
@JsonController("/v1/auth")
export class GetAuthMeController {
  @Get("/me")
  @Authorized()
  async getCurrentUser(@Req() req: Request) {
    const user = req.currentUser;

    if (!user) {
      return { error: "Not authenticated" };
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      locale: user.locale,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }
}
