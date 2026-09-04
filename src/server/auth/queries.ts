import { getCurrentUser } from "@/server/shared/auth-guard";

/**
 * GET /v1/auth/me — current user for the auth bootstrap (exempt from the
 * unassigned gate, matching the Express authorizationChecker exception).
 * Public-ish read helper; not a Server Action.
 */
export async function getAuthMe() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    locale: user.locale,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}
