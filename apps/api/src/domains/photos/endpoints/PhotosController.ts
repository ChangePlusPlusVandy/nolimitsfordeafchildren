import {
  Authorized,
  Body,
  CurrentUser,
  Delete,
  Get,
  HttpError,
  JsonController,
  Param,
  Post,
  QueryParam,
} from "routing-controllers";
import { Service } from "typedi";
import Container from "@/container";
import {
  PhotosService,
  type CreatePhotoInput,
  type GetPhotoUploadUrlInput,
} from "../services/PhotosService";
import type { UserEntity } from "@/db/schema";

@Service()
@JsonController("/v1")
export class PostPhotoUploadUrlController {
  private photosService: PhotosService;

  constructor() {
    this.photosService = Container.get(PhotosService);
  }

  @Post("/photos/upload-url")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Body() body: GetPhotoUploadUrlInput,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    if (!body.location_id || !body.session_date || !body.file_name || !body.content_type) {
      throw new HttpError(400, "location_id, session_date, file_name, and content_type are required");
    }

    try {
      return await this.photosService.getUploadUrl(body, currentUser);
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        throw new HttpError(404, error.message);
      }
      if (error.message?.includes("not assigned")) {
        throw new HttpError(403, error.message);
      }
      if (error.message?.includes("Student is not assigned")) {
        throw new HttpError(422, error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class PostPhotosController {
  private photosService: PhotosService;

  constructor() {
    this.photosService = Container.get(PhotosService);
  }

  @Post("/photos")
  @Authorized(["administrator", "teacher"])
  async handle(
    @Body() body: CreatePhotoInput,
    @CurrentUser({ required: true }) currentUser: UserEntity,
  ) {
    if (!body.location_id || !body.session_date || !body.file_url || !body.file_name) {
      throw new HttpError(400, "location_id, session_date, file_url, and file_name are required");
    }

    try {
      return await this.photosService.createPhoto(body, currentUser);
    } catch (error: any) {
      if (error.message?.includes("not found")) {
        throw new HttpError(404, error.message);
      }
      if (error.message?.includes("not assigned")) {
        throw new HttpError(403, error.message);
      }
      if (error.message?.includes("Student is not assigned")) {
        throw new HttpError(422, error.message);
      }
      throw error;
    }
  }
}

@Service()
@JsonController("/v1")
export class GetPhotosController {
  private photosService: PhotosService;

  constructor() {
    this.photosService = Container.get(PhotosService);
  }

  @Get("/photos")
  @Authorized(["administrator", "teacher", "parent"])
  async handle(
    @QueryParam("location_id") locationId?: string,
    @QueryParam("student_id") studentId?: string,
    @QueryParam("session_date") sessionDate?: string,
    @QueryParam("limit") limit?: number,
    @CurrentUser({ required: true }) currentUser?: UserEntity,
  ) {
    return await this.photosService.listPhotos(
      {
        location_id: locationId,
        student_id: studentId,
        session_date: sessionDate,
        limit,
      },
      currentUser!,
    );
  }
}

@Service()
@JsonController("/v1")
export class DeletePhotoController {
  private photosService: PhotosService;

  constructor() {
    this.photosService = Container.get(PhotosService);
  }

  @Delete("/photos/:id")
  @Authorized(["administrator"])
  async handle(@Param("id") id: string) {
    const deleted = await this.photosService.deletePhoto(id);
    if (!deleted) {
      throw new HttpError(404, "Photo not found");
    }
    return { ok: true };
  }
}
