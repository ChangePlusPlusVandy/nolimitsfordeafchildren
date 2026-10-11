import { staffByLocation as serverStaffByLocation } from "./queries";

export async function getLocationStaff(siteId: string) {
  return serverStaffByLocation(siteId);
}
