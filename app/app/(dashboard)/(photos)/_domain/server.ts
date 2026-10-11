import type { UserEntity } from "@/_platform/db/schema";

import { deletePhoto } from "../_delete/service";
import { listPhotos } from "../_gallery/service";
import { createPhoto, getPhotoUploadUrl } from "../_upload/service";
import type { CreatePhotoInput, GetPhotoUploadUrlInput, ListPhotosQuery } from "./types";

export type { CreatePhotoInput, GetPhotoUploadUrlInput, ListPhotosQuery } from "./types";

export class PhotosService {
  async getUploadUrl(input: GetPhotoUploadUrlInput, currentUser: UserEntity) {
    return getPhotoUploadUrl(input, currentUser);
  }

  async createPhoto(input: CreatePhotoInput, currentUser: UserEntity) {
    return createPhoto(input, currentUser);
  }

  async listPhotos(query: ListPhotosQuery, currentUser: UserEntity) {
    return listPhotos(query, currentUser);
  }

  async deletePhoto(photoId: string) {
    return deletePhoto(photoId);
  }
}

export const photosService = new PhotosService();
