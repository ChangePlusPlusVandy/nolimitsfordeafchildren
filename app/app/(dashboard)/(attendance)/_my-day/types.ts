export interface SessionPhoto {
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
}

export interface SiteOption {
  id: string;
  name: string;
}

export interface StudentPhotoOption {
  id: string;
  label: string;
}
