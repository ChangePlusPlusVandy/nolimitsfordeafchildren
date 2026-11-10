export interface GetPhotoUploadUrlInput {
  location_id: string;
  session_date: string;
  student_id?: string;
  file_name: string;
  content_type: string;
}

export interface CreatePhotoInput {
  location_id: string;
  session_date: string;
  student_id?: string;
  caption?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface ListPhotosQuery {
  location_id?: string;
  student_id?: string;
  session_date?: string;
  page?: number;
  limit?: number;
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
