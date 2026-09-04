import { db } from "@/lib/db";
import { StudentTable, LocationTable, UserTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendBirthdayNotification } from "@/lib/email";

interface JobResult {
  sent: number;
  errors: number;
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
    const today = new Date();

    // Find active students with upcoming birthdays.
    // SQLite has no EXTRACT(); the dataset is small, so the month/day windowing
    // (including year-wrap, e.g. today Dec 28 → next 7 days includes Jan 4) is
    // done in JS here, mirroring the old EXTRACT(MONTH/DAY FROM dob::date) SQL.
    const allActiveStudents = await db
      .select({
        student: StudentTable,
        site: LocationTable,
      })
      .from(StudentTable)
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(eq(StudentTable.is_active, true));

    // Birthday within the next 7 days (inclusive), handling year-wrap
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfWindow = new Date(todayStart);
    endOfWindow.setDate(endOfWindow.getDate() + 7);

    const studentsWithBirthdays = allActiveStudents.filter(({ student }) => {
      const dob = new Date(student.dob);
      let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < todayStart) {
        nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
      }
      return nextBirthday >= todayStart && nextBirthday <= endOfWindow;
    });

    if (studentsWithBirthdays.length === 0) {
      console.log("[Birthday Job] No upcoming birthdays found");
      return { sent: 0, errors: 0 };
    }

    console.log(
      `[Birthday Job] Found ${studentsWithBirthdays.length} students with upcoming birthdays`,
    );

    // Get site administrators to notify
    const admins = await db
      .select()
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

    if (admins.length === 0) {
      console.log("[Birthday Job] No active administrators found");
      return { sent: 0, errors: 0 };
    }

    // Calculate age and send notifications
    for (const { student, site } of studentsWithBirthdays) {
      const dob = new Date(student.dob);
      const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

      // If birthday already passed this year, use next year for age calculation
      let upcomingBirthday = birthdayThisYear;
      if (birthdayThisYear < today) {
        upcomingBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
      }

      const age = upcomingBirthday.getFullYear() - dob.getFullYear();

      // Send to all administrators (could be enhanced to send only to site-specific admins)
      for (const admin of admins) {
        try {
          const birthdayStr = upcomingBirthday.toISOString().split("T")[0] ?? "";
          const result = await sendBirthdayNotification(
            admin.email,
            `${student.first_name} ${student.last_name}`,
            student.initials,
            birthdayStr,
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
