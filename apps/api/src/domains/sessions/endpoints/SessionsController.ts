import {
  Authorized,
  Body,
  Get,
  HttpError,
  JsonController,
  Param,
  Patch,
  Post,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  SessionsService,
  type CreateSessionInput,
  type UpdateSessionInput,
} from "../services/SessionsService";

@Service()
@JsonController("/v1")
export class GetSessionsController {
  private sessionsService: SessionsService;
  constructor() {
    this.sessionsService = Container.get(SessionsService);
  }

  @Get("/sessions")
  @Authorized(["administrator"])
  async handle(
    @QueryParam("include_archived") includeArchived?: boolean,
    @QueryParam("active_only") activeOnly?: boolean,
  ) {
    return await this.sessionsService.index({
      include_archived: includeArchived,
      active_only: activeOnly,
    });
  }
}

@Service()
@JsonController("/v1")
export class GetCurrentSessionController {
  private sessionsService: SessionsService;
  constructor() {
    this.sessionsService = Container.get(SessionsService);
  }

  @Get("/sessions/current")
  @Authorized(["administrator"])
  async handle() {
    const session = await this.sessionsService.getCurrentSession();
    return { item: session };
  }
}

@Service()
@JsonController("/v1")
export class PostSessionsController {
  private sessionsService: SessionsService;
  constructor() {
    this.sessionsService = Container.get(SessionsService);
  }

  @Post("/sessions")
  @Authorized(["administrator"])
  async handle(@Body() body: CreateSessionInput) {
    if (!body.name || !body.start_date || !body.end_date) {
      throw new HttpError(400, "name, start_date, and end_date are required");
    }

    try {
      return await this.sessionsService.create(body);
    } catch (error: any) {
      if (error.message?.includes("required") || error.message?.includes("must be")) {
        throw new HttpError(422, error.message);
      }
      if (error.message?.includes("already exists")) {
        throw new HttpError(409, error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class PatchSessionController {
  private sessionsService: SessionsService;
  constructor() {
    this.sessionsService = Container.get(SessionsService);
  }

  @Patch("/sessions/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string, @Body() body: UpdateSessionInput) {
    try {
      const updated = await this.sessionsService.update(id, body);
      if (!updated) {
        throw new HttpError(404, "Session not found");
      }
      return updated;
    } catch (error: any) {
      if (error.message?.includes("must be")) {
        throw new HttpError(422, error.message);
      }
      throw error;
    }
  }
}
