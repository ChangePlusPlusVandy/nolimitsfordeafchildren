import type { CreateStudentInput } from "../_domain/types";
import { createStudent as serverCreateStudent } from "./actions";

export async function createStudent(payload: CreateStudentInput) {
  return serverCreateStudent(payload);
}
