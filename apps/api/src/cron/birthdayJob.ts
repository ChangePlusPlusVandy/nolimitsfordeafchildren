import { db } from "../db";
import { StudentTable, LocationTable, UserTable } from "../db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";
import { sendBirthdayNotification } from "../email";

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
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get current month and day range for birthday matching
    // We need to handle year-wrap (e.g., if today is Dec 28, next 7 days includes Jan 4)
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const futureMonth = sevenDaysFromNow.getMonth() + 1;
    const futureDay = sevenDaysFromNow.getDate();

    // Find active students with upcoming birthdays
    // Using SQL to extract month and day from DOB
    const studentsWithBirthdays = await db
      .select({
        student: StudentTable,
        site: LocationTable,
      })
      .from(StudentTable)
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(
        and(
          eq(StudentTable.is_active, true),
          // Birthday within next 7 days (handles month/day comparison)
          sql`(
            (EXTRACT(MONTH FROM ${StudentTable.dob}::date) = ${todayMonth} AND EXTRACT(DAY FROM ${StudentTable.dob}::date) >= ${todayDay})
            OR (EXTRACT(MONTH FROM ${StudentTable.dob}::date) = ${futureMonth} AND EXTRACT(DAY FROM ${StudentTable.dob}::date) <= ${futureDay})
            ${todayMonth !== futureMonth ? sql`OR (EXTRACT(MONTH FROM ${StudentTable.dob}::date) > ${todayMonth} AND EXTRACT(MONTH FROM ${StudentTable.dob}::date) < ${futureMonth})` : sql``}
          )`,
        ),
      );

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
