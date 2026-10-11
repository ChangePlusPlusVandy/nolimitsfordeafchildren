import type { CreateTeacherInput } from "../_domain/types";
import { createTeacher as serverCreateTeacher } from "./actions";

export async function createTeacher(payload: CreateTeacherInput) {
  return serverCreateTeacher(payload);
}
