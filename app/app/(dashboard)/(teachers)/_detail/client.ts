import type { TeacherDetails } from "../_domain/types";
import { getTeacher as serverGetTeacher } from "./queries";

export async function getTeacherDetails(id: string): Promise<TeacherDetails> {
  return serverGetTeacher(id) as never;
}
