export type * from "./types";
export { listStudents } from "../_list/client";
export { getStudentDetails } from "../_detail/client";
export { createStudent } from "../_create/client";
export { updateStudent } from "../_edit/client";
export { updateGuardianSummary } from "../_guardian-summary/client";
export {
  addSiblingToStudent,
  updateSiblingOfStudent,
  removeSiblingFromStudent,
} from "../_siblings/client";
export {
  getStudentTeachers,
  listLinkableTeachers,
  linkTeacherToStudent,
  unlinkTeacherFromStudent,
} from "../_links/teachers/client";
export { linkParentToStudent, unlinkParentFromStudent } from "../_links/parents/client";
