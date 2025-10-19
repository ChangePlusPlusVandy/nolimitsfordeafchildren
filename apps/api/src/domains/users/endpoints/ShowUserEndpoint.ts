import { Get, HttpError, JsonController, Param } from "routing-controllers";
import { Service, Inject } from "typedi";
import { UserService } from "../services/UserService";

@Service()
@JsonController("/v1/users")
export class ShowUserEndpoint {
  constructor(
    @Inject(() => UserService)
    private readonly userService: UserService
  ) {}

  @Get("/:id")
  async handle(@Param("id") id: string) {
    const user = await this.userService.getById(id); 

    if (user === undefined) {
      return new HttpError(404, "User not found");
    }

    return user;
  }
}