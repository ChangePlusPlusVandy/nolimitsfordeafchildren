import { Get, JsonController, Param } from "routing-controllers";
import { Service } from "typedi";
import type { UserService } from "../services/UserService";

@Service()
@JsonController("/v1/users")
export class ShowUserEndpoint {
  constructor(
    private readonly userService: UserService
  ) {}

  @Get("/{id}")
  async handle(@Param("id") id: string) {
    return this.userService.getById(id); 
  }
}