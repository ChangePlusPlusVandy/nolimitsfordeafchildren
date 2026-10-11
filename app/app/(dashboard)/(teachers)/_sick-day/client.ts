import { postTeacherSickDayNotice as serverPostTeacherSickDayNotice } from "./actions";

export async function postTeacherSickDayNotice(input: {
  notice_date?: string;
  note?: string;
  site_id?: string;
}) {
  return serverPostTeacherSickDayNotice(input);
}
