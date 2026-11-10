import type { UserEntity } from "@/_platform/db/schema";

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  photo_url?: string;
  locale?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface UserProfileWithIds extends UserEntity {
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
  parentAddress?: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}

export interface MeProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  locale: string;
  role: "administrator" | "teacher" | "parent" | "unassigned";
  is_active: boolean;
  created_at: string;
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
  parentAddress?: {
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  } | null;
}
