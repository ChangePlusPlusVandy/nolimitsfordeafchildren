import { and, eq } from "drizzle-orm";

import { LocationTable, StudentTable, UserTable } from "@/db/schema";
import { db } from "@/lib/db";
import { sendBirthdayNotification } from "@/lib/email";
import { addDaysStr, parseDateOnly, todayStr } from "@/server/shared/dates";

interface JobResult {
  sent: number;
  errors: number;
}

function birthdayDateStr(year: number, dob: string): string {
  const { month, day } = parseDateOnly(dob);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextBirthdayDateStr(dob: string, fromDateStr: string): string {
  const fromParts = parseDateOnly(fromDateStr);
  let candidate = birthdayDateStr(fromParts.year, dob);
  if (candidate < fromDateStr) {
    candidate = birthdayDateStr(fromParts.year + 1, dob);
  }
  return candidate;
}

/**
 * Birthday notification job
 * Finds students with birthdays in the next 7 days
 * Sends notifications to site administrators
 */
export async function runBirthdayJob(): Promise<JobResult> {
  let sent = 0;
  let errors = 0;

  try {
    const todayDateStr = todayStr();
    const windowEndStr = addDaysStr(todayDateStr, 7);

    const allActiveStudents = await db
      .select({
        student: StudentTable,
        site: LocationTable,
      })
      .from(StudentTable)
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(eq(StudentTable.is_active, true));

    const studentsWithBirthdays = allActiveStudents.filter(({ student }) => {
      const upcoming = nextBirthdayDateStr(student.dob, todayDateStr);
      return upcoming >= todayDateStr && upcoming <= windowEndStr;
    });

    if (studentsWithBirthdays.length === 0) {
      console.log("[Birthday Job] No upcoming birthdays found");
      return { sent: 0, errors: 0 };
    }

    console.log(
      `[Birthday Job] Found ${studentsWithBirthdays.length} students with upcoming birthdays`,
    );

    const admins = await db
      .select()
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

    if (admins.length === 0) {
      console.log("[Birthday Job] No active administrators found");
      return { sent: 0, errors: 0 };
    }

    for (const { student, site } of studentsWithBirthdays) {
      const upcomingBirthdayStr = nextBirthdayDateStr(student.dob, todayDateStr);
      const age = parseDateOnly(upcomingBirthdayStr).year - parseDateOnly(student.dob).year;

      for (const admin of admins) {
        try {
          const result = await sendBirthdayNotification(
            admin.email,
            `${student.first_name} ${student.last_name}`,
            student.initials,
            upcomingBirthdayStr,
            age,
            site.name,
          );

          if (result.success) {
            sent++;
          } else {
            errors++;
            console.error(
              `[Birthday Job] Failed to send for ${student.initials} to ${admin.email}: ${result.error}`,
            );
          }
        } catch (error) {
          errors++;
          console.error(
            `[Birthday Job] Error sending for ${student.initials} to ${admin.email}:`,
            error,
          );
        }
      }
    }

    return { sent, errors };
  } catch (error) {
    console.error("[Birthday Job] Fatal error:", error);
    throw error;
  }
}
