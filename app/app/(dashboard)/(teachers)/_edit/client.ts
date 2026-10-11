import type { UpdateTeacherInput } from "../_domain/types";
import { updateTeacher as serverUpdateTeacher } from "./actions";

export async function updateTeacher(payload: UpdateTeacherInput & { id: string }) {
  const { id, ...data } = payload;
  return serverUpdateTeacher(id, data);
}
