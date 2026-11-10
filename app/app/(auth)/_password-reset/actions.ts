"use server";

import { isEmailConfigured } from "@/_platform/email";

export async function passwordResetEmailConfigured(): Promise<boolean> {
  return isEmailConfigured();
}
