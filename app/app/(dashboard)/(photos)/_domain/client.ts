import { deletePhoto as serverDeletePhoto } from "../_delete/actions";
import { listPhotos as serverListPhotos } from "../_gallery/queries";
import {
  createPhoto as serverCreatePhoto,
  getPhotoUploadUrl as serverGetPhotoUploadUrl,
} from "../_upload/actions";
import type { PaginatedPhotosResponse } from "./types";

export type {
  CreatePhotoInput,
  GetPhotoUploadUrlInput,
  ListPhotosQuery,
  PaginatedPhotosResponse,
  PhotoEntity,
} from "./types";

export async function listPhotos(
  params?: import("./types").ListPhotosQuery,
): Promise<PaginatedPhotosResponse> {
  return serverListPhotos(params as never) as never;
}

/** Photos for a given session date (teacher "my day" photo strip). */
export async function listSessionPhotos(
  sessionDate: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedPhotosResponse> {
  return serverListPhotos({ session_date: sessionDate, ...params } as never) as never;
}

export async function getPhotoUploadUrl(input: import("./types").GetPhotoUploadUrlInput) {
  return serverGetPhotoUploadUrl(input);
}

export async function createPhoto(input: import("./types").CreatePhotoInput) {
  return serverCreatePhoto(input);
}

export async function deletePhoto(photoId: string) {
  return serverDeletePhoto(photoId);
}
