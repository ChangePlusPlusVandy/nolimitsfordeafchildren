import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Email senders using the Cloudflare `send_email` binding (`EMAIL` in
 * wrangler.jsonc). Replaces the old Resend client from the Express app;
 * the inline HTML templates are ported verbatim.
 *
 * EMAIL IS EXPLICITLY DISABLED UNTIL CONFIGURED — it never fakes a
 * successful send:
 *  - The `send_email` binding must exist in wrangler.jsonc AND
 *  - `EMAIL_FROM_ADDRESS` must be set to a from-address VERIFIED in the
 *    Cloudflare dashboard (Workers & Pages -> Email -> Settings ->
 *    Destination addresses).
 * Until both are true every sender returns `{ success: false }` with a
 * console.warn and no email is attempted, so callers (cron jobs, alerts)
 * fail loudly instead of pretending delivery.
 *
 * NOTE: Cloudflare requires `from` to be exactly the verified address and
 * uses the structured Send Email builder
 * ({ from, to, subject, html|text }) — the old MIME-style
 * `personalizations`/`content` payload is not part of the current binding
 * contract (see the generated SendEmail types in cloudflare-env.d.ts).
 */

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

function getConfig(key: string): string | undefined {
  // Bindings/vars live in the worker env; `process.env` is a fallback for
  // environments where OpenNext has not populated it (e.g. some dev flows).
  try {
    const ctxEnv = getCloudflareContext().env as unknown as Record<string, string | undefined>;
    const value = ctxEnv[key];
    if (value !== undefined && value !== "") return value;
  } catch {
    // No request context (e.g. module evaluation or non-worker runtime).
  }
  return process.env[key];
}

function getFromAddress(): string | null {
  // No default fallback on purpose: sending from a non-verified address
  // fails (or worse, could be spoofed); email stays disabled until the
  // operator sets a verified EMAIL_FROM_ADDRESS.
  return getConfig("EMAIL_FROM_ADDRESS") || null;
}

function getEmailBinding(): SendEmail | null {
  try {
    const binding = getCloudflareContext().env.EMAIL as SendEmail | undefined;
    return binding ?? null;
  } catch {
    return null;
  }
}

async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const email = getEmailBinding();
  const from = getFromAddress();

  if (!email || !from) {
    console.warn(
      `[Email] DISABLED — email not configured (need send_email binding AND verified EMAIL_FROM_ADDRESS). Dropping "${input.subject}" without sending.`,
    );
    return {
      success: false,
      error: "Email disabled: EMAIL_FROM_ADDRESS must be set to a verified Cloudflare from-address",
    };
  }

  try {
    const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
    if (recipients.length === 0) {
      console.warn(`[Email] Skipping "${input.subject}": no recipient address`);
      return { success: false, error: "No recipient address" };
    }

    // Structured Send Email binding message:
    // https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
    await email.send({
      from,
      to: recipients,
      subject: input.subject,
      html: input.html,
    });
    console.log(`[Email] Sent "${input.subject}" to ${recipients.join(", ")}`);
    return { success: true, id: `send-email:${from}` };
  } catch (error) {
    console.error("[Email] Error sending:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Footer used by all templates (automated message). */
const FOOTER = `
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">
    This is an automated message from No Limits for Deaf Children.
  </p>`;

/**
 * Send missed session alert to admin
 * Called immediately when attendance is marked as "no_show"
 */
export async function sendMissedSessionAlert(
  adminEmail: string,
  studentName: string,
  studentInitials: string,
  sessionDate: string,
  teacherName: string,
  siteName: string,
  reason?: string,
): Promise<EmailResult> {
  const formattedDate = new Date(sessionDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return sendEmail({
    to: adminEmail,
    subject: `Missed Session Alert: ${studentInitials} on ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Missed Session Alert</h2>
        <p>A student has missed their scheduled session.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Student:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${studentName} (${studentInitials})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Teacher:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${teacherName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Site:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${siteName}</td>
          </tr>
          ${
            reason
              ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${reason.replace(/_/g, " ")}</td>
          </tr>
          `
              : ""
          }
        </table>

        <p style="color: #666; font-size: 14px;">
          Please follow up with the family to determine if a make-up session is needed.
        </p>

        ${FOOTER}
      </div>
    `,
  });
}

/**
 * Send birthday notification
 * Called by cron job for birthdays in the next 7 days
 */
export async function sendBirthdayNotification(
  recipientEmail: string,
  studentName: string,
  studentInitials: string,
  birthday: string,
  age: number,
  siteName: string,
): Promise<EmailResult> {
  const birthdayDate = new Date(birthday);
  const formattedDate = birthdayDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return sendEmail({
    to: recipientEmail,
    subject: `Upcoming Birthday: ${studentInitials} turns ${age}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Upcoming Birthday!</h2>
        <p>A student at your site has an upcoming birthday.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;">
            <strong>${studentName}</strong> (${studentInitials})
          </p>
          <p style="margin: 10px 0 0 0; color: #666;">
            Turns <strong>${age}</strong> on <strong>${formattedDate}</strong>
          </p>
          <p style="margin: 10px 0 0 0; color: #666;">
            Site: ${siteName}
          </p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Consider recognizing this milestone during their next session!
        </p>

        ${FOOTER}
      </div>
    `,
  });
}

/**
 * Send audiogram due reminder
 * Called by cron job for audiograms due in the next 30 days
 */
export async function sendAudiogramReminder(
  adminEmail: string,
  studentName: string,
  studentInitials: string,
  dueDate: string,
  siteName: string,
  daysUntilDue: number,
): Promise<EmailResult> {
  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const urgencyColor = daysUntilDue <= 7 ? "#d32f2f" : daysUntilDue <= 14 ? "#ff9800" : "#1976d2";
  const urgencyText = daysUntilDue <= 7 ? "URGENT" : daysUntilDue <= 14 ? "Due Soon" : "Reminder";

  return sendEmail({
    to: adminEmail,
    subject: `${urgencyText}: Audiogram due for ${studentInitials} on ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${urgencyColor};">Audiogram ${urgencyText}</h2>
        <p>A student's audiogram is due soon and needs to be uploaded.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Student:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${studentName} (${studentInitials})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Site:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${siteName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Due Date:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Days Remaining:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${urgencyColor}; font-weight: bold;">
              ${daysUntilDue} days
            </td>
          </tr>
        </table>

        <p style="color: #666; font-size: 14px;">
          Please remind the family to submit their child's updated audiogram to maintain compliance.
        </p>

        ${FOOTER}
      </div>
    `,
  });
}

/**
 * Send makeup request notification to admin
 */
export async function sendMakeupRequestNotification(
  adminEmail: string,
  studentName: string,
  studentInitials: string,
  requestedByName: string,
  missedDate: string,
  reason: string,
  siteName: string,
): Promise<EmailResult> {
  const formattedDate = new Date(missedDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return sendEmail({
    to: adminEmail,
    subject: `Make-Up Request: ${studentInitials} - ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Make-Up Request</h2>
        <p>A parent has submitted a make-up class request.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Student:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${studentName} (${studentInitials})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requested By:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestedByName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Missed Session:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Site:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${siteName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${reason.replace(/_/g, " ")}</td>
          </tr>
        </table>

        <p style="color: #666; font-size: 14px;">
          Please review this request in the admin dashboard.
        </p>

        ${FOOTER}
      </div>
    `,
  });
}

/**
 * Send schedule change request notification to admin
 */
export async function sendScheduleChangeRequestNotification(
  adminEmail: string,
  studentName: string,
  studentInitials: string,
  requestedByName: string,
  reason: string,
  currentSchedule: string,
  requestedSchedule: string,
): Promise<EmailResult> {
  return sendEmail({
    to: adminEmail,
    subject: `Schedule Change Request: ${studentInitials}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Schedule Change Request</h2>
        <p>A parent has submitted a schedule change request.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Student:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${studentName} (${studentInitials})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requested By:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestedByName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Current Schedule:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${currentSchedule}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Requested Schedule:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${requestedSchedule}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${reason}</td>
          </tr>
        </table>

        <p style="color: #666; font-size: 14px;">
          Please review this request in the admin dashboard. Approving will automatically update the student's enrollment.
        </p>

        ${FOOTER}
      </div>
    `,
  });
}
