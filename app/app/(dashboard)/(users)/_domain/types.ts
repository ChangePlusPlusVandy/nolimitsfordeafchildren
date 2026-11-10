import type { UserEntity } from "@/_platform/db/schema";

export const USER_ROLES = ["administrator", "teacher", "parent", "unassigned"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface ListUsersQuery {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: "name" | "email" | "created_at";
  order?: "asc" | "desc";
}

export interface InviteUserInput {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  primary_site_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface UserWithLinkedStudents extends UserEntity {
  linked_students: Array<{
    link_id: string;
    student_id: string;
    initials: string;
    first_name: string;
    last_name: string;
    relationship: string | null;
    is_primary: boolean;
    linked_at: Date;
  }>;
}

export interface User {
  id: string;
  authUserId: string | null;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_students?: Array<{
    link_id: string;
    student_id: string;
    initials: string;
    first_name: string;
    last_name: string;
    relationship: string | null;
    is_primary: boolean;
    linked_at: string;
  }>;
}

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
