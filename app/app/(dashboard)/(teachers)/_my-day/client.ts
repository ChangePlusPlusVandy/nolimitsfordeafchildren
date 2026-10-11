import type { MyDayResponse } from "../_domain/types";
import { getTeachersMeDay as serverGetTeachersMeDay } from "./queries";

export async function getMyDay(params?: {
  date?: string;
  start_date?: string;
  end_date?: string;
}): Promise<MyDayResponse> {
  return serverGetTeachersMeDay(params as never) as never;
}
