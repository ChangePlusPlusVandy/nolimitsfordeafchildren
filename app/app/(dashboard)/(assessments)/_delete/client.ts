import { deleteAssessment as serverDeleteAssessment } from "./actions";

export async function deleteAssessment(id: string) {
  return serverDeleteAssessment(id);
}
