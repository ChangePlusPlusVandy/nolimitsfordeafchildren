import type { StudentDetails } from "../_domain/types";
import { getStudent as serverGetStudent } from "./queries";

export async function getStudentDetails(id: string): Promise<StudentDetails> {
  return serverGetStudent(id) as never;
}
