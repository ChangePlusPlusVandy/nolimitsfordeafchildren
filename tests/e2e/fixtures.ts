import { expect, type Page } from "@playwright/test";

const SEED_PASSWORD = "NoLimits!2026";
const AUTH_TIMEOUT_MS = 30_000;
const AUTH_STATE_DIR = "playwright/.cache/auth";

// Fake accounts from db:seed; stranger is a parent with no linked children.
export const ROLE_CREDS = {
  admin: { email: "admin@nolimits.test", password: SEED_PASSWORD },
  teacher: { email: "teacher@nolimits.test", password: SEED_PASSWORD },
  parent: { email: "parent@nolimits.test", password: SEED_PASSWORD },
  stranger: { email: "stranger@nolimits.test", password: SEED_PASSWORD },
  pending: { email: "pending@nolimits.test", password: SEED_PASSWORD },
} as const;

export type Role = keyof typeof ROLE_CREDS;

const ROLE_HOME: Record<Role, RegExp> = {
  admin: /\/users/,
  teacher: /\/my-day/,
  parent: /\/my-students/,
  stranger: /\/my-students/,
  pending: /\/pending-approval/,
};

export async function signIn(page: Page, role: Role): Promise<void> {
  // Wait for hydration so controlled inputs do not discard the filled values.
  const session = page.waitForResponse(
    (response) => response.url().includes("/api/auth/get-session"),
    { timeout: AUTH_TIMEOUT_MS },
  );
  await page.goto("/login");
  await session;

  const { email, password } = ROLE_CREDS[role];
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeEnabled();
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(ROLE_HOME[role], { timeout: AUTH_TIMEOUT_MS });
}

export async function signInAsAdmin(page: Page): Promise<void> {
  await signIn(page, "admin");
}

export function sessionPath(role: Role): string {
  return `${AUTH_STATE_DIR}/${role}.json`;
}

export async function saveSession(page: Page, role: Role): Promise<void> {
  await signIn(page, role);
  await page.context().storageState({ path: sessionPath(role) });
}

// Optional e2e/auth.setup.ts (each setup gets a fresh browser context):
// import { test as setup } from "@playwright/test";
// import { ROLE_CREDS, saveSession, type Role } from "./fixtures";
//
// for (const role of Object.keys(ROLE_CREDS) as Role[]) {
//   setup(role, async ({ page }) => {
//     await saveSession(page, role);
//   });
// }
//
// Optional playwright.config.ts project entries, using specs in e2e/<role>/:
// import { ROLE_CREDS, sessionPath, type Role } from "./e2e/fixtures";
//
// { name: "auth-setup", testMatch: /auth\.setup\.ts/ },
// ...Object.keys(ROLE_CREDS).map((role) => ({
//   name: `chromium-${role}`,
//   testMatch: `**/e2e/${role}/**/*.spec.ts`,
//   dependencies: ["auth-setup"],
//   use: { ...devices["Desktop Chrome"], storageState: sessionPath(role as Role) },
// })),
//
// Keep the existing chromium project for root specs only:
// testMatch: "**/e2e/*.spec.ts"
