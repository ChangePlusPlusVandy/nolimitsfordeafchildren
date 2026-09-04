import { db } from "@/lib/db";
import { DocumentTable, StudentTable, LocationTable, UserTable } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { sendAudiogramReminder } from "@/lib/email";

interface JobResult {
  sent: number;
  errors: number;
}

/**
 * Audiogram reminder job
 * Finds students with audiograms due in the next 30 days
 * Sends reminders to site administrators
 */
export async function runAudiogramJob(): Promise<JobResult> {
  let sent = 0;
  let errors = 0;

  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const todayStr = today.toISOString().split("T")[0] ?? "";
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0] ?? "";

    // Find audiograms due in the next 30 days
    // Gets the most recent audiogram for each student that has a next_due_date
    const documentsWithDueDates = await db
      .select({
        document: DocumentTable,
        student: StudentTable,
        site: LocationTable,
      })
      .from(DocumentTable)
      .innerJoin(
        StudentTable,
        and(eq(DocumentTable.entity_type, "student"), eq(DocumentTable.entity_id, StudentTable.id)),
      )
      .innerJoin(LocationTable, eq(StudentTable.site_id, LocationTable.id))
      .where(
        and(
          eq(DocumentTable.document_type, "audiogram"),
          eq(StudentTable.is_active, true),
          // Due date is within next 30 days
          gte(DocumentTable.next_due_date, todayStr),
          lte(DocumentTable.next_due_date, thirtyDaysStr),
        ),
      )
      .orderBy(DocumentTable.next_due_date);

    if (documentsWithDueDates.length === 0) {
      console.log("[Audiogram Job] No audiograms due in the next 30 days");
      return { sent: 0, errors: 0 };
    }

    console.log(`[Audiogram Job] Found ${documentsWithDueDates.length} audiograms due soon`);

    // Get site administrators to notify
    const admins = await db
      .select()
      .from(UserTable)
      .where(and(eq(UserTable.role, "administrator"), eq(UserTable.is_active, true)));

    if (admins.length === 0) {
      console.log("[Audiogram Job] No active administrators found");
      return { sent: 0, errors: 0 };
    }

    // Group by student to avoid duplicate notifications
    const studentMap = new Map<
      string,
      {
        student: (typeof documentsWithDueDates)[0]["student"];
        site: (typeof documentsWithDueDates)[0]["site"];
        dueDate: string;
      }
    >();

    for (const { document, student, site } of documentsWithDueDates) {
      // Only keep the earliest due date per student
      if (!studentMap.has(student.id) && document.next_due_date) {
        studentMap.set(student.id, {
          student,
          site,
          dueDate: document.next_due_date,
        });
      }
    }

    // Send notifications
    for (const { student, site, dueDate } of studentMap.values()) {
      const dueDateObj = new Date(dueDate);
      const daysUntilDue = Math.ceil(
        (dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Send to all administrators
      for (const admin of admins) {
        try {
          const result = await sendAudiogramReminder(
            admin.email,
            `${student.first_name} ${student.last_name}`,
            student.initials,
            dueDate,
            site.name,
            daysUntilDue,
          );

          if (result.success) {
            sent++;
          } else {
            errors++;
            console.error(
              `[Audiogram Job] Failed to send for ${student.initials} to ${admin.email}: ${result.error}`,
            );
          }
        } catch (error) {
          errors++;
          console.error(
            `[Audiogram Job] Error sending for ${student.initials} to ${admin.email}:`,
            error,
          );
        }
      }
    }

    return { sent, errors };
  } catch (error) {
    console.error("[Audiogram Job] Fatal error:", error);
    throw error;
  }
}
