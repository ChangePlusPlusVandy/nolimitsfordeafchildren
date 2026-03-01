import { Get, HttpError, JsonController, Param, UseBefore } from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import { UserService } from "../services/UserService";

@Service()
@JsonController("/v1/users")
export class ShowUserEndpoint {
  private userService: UserService;
  constructor() {
    this.userService = Container.get(UserService);
  }

  @Get("/:id")
  async handle(@Param("id") id: string) {
    const user = await this.userService.getById(id);

    if (user === undefined) {
      return new HttpError(404, "User not found");
    }

    return user;
  }
}
