import type { UpdateStudentInput } from "../_domain/types";
import { updateStudent as serverUpdateStudent } from "./actions";

export async function updateStudent(payload: UpdateStudentInput & { id: string }) {
  const { id, ...data } = payload;
  return serverUpdateStudent(id, data);
}
