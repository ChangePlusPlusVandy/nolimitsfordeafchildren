import { updateGuardianSummary as serverUpdateGuardianSummary } from "./actions";

export async function updateGuardianSummary(studentId: string, guardianSummary: string) {
  return serverUpdateGuardianSummary(studentId, {
    guardian_summary: guardianSummary.trim() || null,
  });
}
