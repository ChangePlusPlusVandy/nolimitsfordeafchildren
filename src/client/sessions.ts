/**
 * Thin client data-access layer for Sessions (admin) and Photos (gallery).
 *
 * Names reconcile 1:1 with `src/server/sessions/{queries,actions}.ts` and
 * `src/server/photos/{queries,actions}.ts`.
 */

import {
  createPhoto as serverCreatePhoto,
  deletePhoto as serverDeletePhoto,
  getPhotoUploadUrl as serverGetPhotoUploadUrl,
} from "@/server/photos/actions";
import { listPhotos as serverListPhotos } from "@/server/photos/queries";
import {
  createSession as serverCreateSession,
  updateSession as serverUpdateSession,
} from "@/server/sessions/actions";
import {
  getCurrentSession as serverGetCurrentSession,
  listSessions as serverListSessions,
} from "@/server/sessions/queries";

export type { CreatePhotoInput, ListPhotosQuery } from "@/server/photos/service";
export type {
  CreateSessionInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from "@/server/sessions/service";

export type SessionEntity = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export interface PaginatedSessionsResponse {
  items: SessionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listSessions(
  params?: import("@/server/sessions/service").ListSessionsQuery,
): Promise<PaginatedSessionsResponse> {
  return serverListSessions(params as never) as never;
}

export async function getCurrentSession() {
  return serverGetCurrentSession();
}

export async function createSession(input: import("@/server/sessions/service").CreateSessionInput) {
  return serverCreateSession(input);
}

export async function updateSession(
  id: string,
  input: import("@/server/sessions/service").UpdateSessionInput,
) {
  return serverUpdateSession(id, input);
}

export type PhotoEntity = {
  id: string;
  session_date: string;
  caption: string | null;
  file_url: string;
  file_name: string;
  location: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    initials: string;
  } | null;
  uploaded_by_user: {
    id: string;
    name: string;
  };
};

export interface PaginatedPhotosResponse {
  items: PhotoEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listPhotos(
  params?: import("@/server/photos/service").ListPhotosQuery,
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

export async function getPhotoUploadUrl(
  input: import("@/server/photos/service").GetPhotoUploadUrlInput,
) {
  return serverGetPhotoUploadUrl(input);
}

export async function createPhoto(input: import("@/server/photos/service").CreatePhotoInput) {
  return serverCreatePhoto(input);
}

export async function deletePhoto(photoId: string) {
  return serverDeletePhoto(photoId);
}
