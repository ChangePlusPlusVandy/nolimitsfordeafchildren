import {
  assignTeacherLocation as serverAssignTeacherLocation,
  unassignTeacherLocation as serverUnassignTeacherLocation,
} from "./actions";
import { getTeacherLocations as serverGetTeacherLocations } from "./queries";

export async function getTeacherLocations(teacherId: string) {
  return serverGetTeacherLocations(teacherId);
}

export async function assignLocationToTeacher({
  teacherId,
  locationId,
}: {
  teacherId: string;
  locationId: string;
}) {
  await serverAssignTeacherLocation(teacherId, locationId);
  return { success: true };
}

export async function unassignLocationFromTeacher({
  teacherId,
  locationId,
}: {
  teacherId: string;
  locationId: string;
}) {
  await serverUnassignTeacherLocation(teacherId, locationId);
  return { success: true };
}
