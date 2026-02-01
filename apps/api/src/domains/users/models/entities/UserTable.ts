// Re-export from central schema for backward compatibility
export {
  UserTable,
  TeacherProfileTable,
  StudentTable,
  ParentProfileTable,
  TeacherStudentTable,
  ParentStudentLinkTable,
  AttendanceTable,
  EnrollmentTable,
  type UserEntity,
  type TeacherProfileEntity,
  type StudentEntity,
  type ParentProfileEntity,
} from "@/db/schema";

// Legacy alias for backward compatibility
export { TeacherStudentTable as TeacherStudent } from "@/db/schema";
