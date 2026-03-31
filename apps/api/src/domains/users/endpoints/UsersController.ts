import {
  Body,
  Get,
  JsonController,
  Patch,
  Post,
  Delete,
  QueryParam,
  Param,
  Authorized,
  HttpCode,
  NotFoundError,
  BadRequestError,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  UsersService,
  type ListUsersQuery,
  type InviteUserInput,
  type UpdateUserInput,
} from "../services/UsersService";

/**
 * GET /v1/users
 * List all users with filtering and pagination
 * Admin only
 */
@Service()
@JsonController("/v1")
export class GetUsersController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Get("/users")
  @Authorized(["administrator"])
  async handle(
    @QueryParam("search") search?: string,
    @QueryParam("role") role?: "administrator" | "teacher" | "parent" | "unassigned",
    @QueryParam("is_active") is_active?: boolean,
    @QueryParam("page") page?: number,
    @QueryParam("limit") limit?: number,
    @QueryParam("sort") sort?: "name" | "email" | "created_at",
    @QueryParam("order") order?: "asc" | "desc",
  ) {
    const query: ListUsersQuery = { search, role, is_active, page, limit, sort, order };
    return await this.usersService.index(query);
  }
}

/**
 * GET /v1/users/:id
 * Get a single user by ID
 * Admin only
 */
@Service()
@JsonController("/v1")
export class GetUserController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Get("/users/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const user = await this.usersService.show(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
}

/**
 * POST /v1/users/invite
 * Invite a new user
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PostUsersInviteController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Post("/users/invite")
  @Authorized(["administrator"])
  @HttpCode(201)
  async handle(@Body() body: InviteUserInput) {
    if (!body.email || !body.name || !body.role) {
      throw new BadRequestError("email, name, and role are required");
    }

    if (!["administrator", "teacher", "parent", "unassigned"].includes(body.role)) {
      throw new BadRequestError("role must be administrator, teacher, parent, or unassigned");
    }

    try {
      return await this.usersService.invite(body);
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}

/**
 * PATCH /v1/users/:id
 * Update a user
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PatchUserController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Patch("/users/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateUserInput) {
    try {
      const user = await this.usersService.update(id, body);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes("already in use")) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}

/**
 * DELETE /v1/users/:id
 * Disable (soft delete) a user
 * Admin only
 */
@Service()
@JsonController("/v1")
export class DeleteUserController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Delete("/users/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const user = await this.usersService.disable(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return { success: true, message: "User disabled" };
  }
}

/**
 * POST /v1/users/:id/enable
 * Re-enable a disabled user
 * Admin only
 */
@Service()
@JsonController("/v1")
export class PostEnableUserController {
  private usersService: UsersService;
  constructor() {
    this.usersService = Container.get(UsersService);
  }

  @Post("/users/:id/enable")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const user = await this.usersService.enable(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
}
