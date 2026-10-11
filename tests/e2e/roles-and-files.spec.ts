import { randomUUID } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { ROLE_CREDS, signIn, type Role } from "./fixtures";

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const TEST_TIMEOUT_MS = 60_000;
const DENIED = "Student not found or access denied.";
const roles = Object.keys(ROLE_CREDS) as Role[];
let students: { mia: string; ava: string; noah: string };

test.describe.configure({ mode: "default", timeout: TEST_TIMEOUT_MS });

async function studentId(page: Page, initials: string): Promise<string> {
  await page.goto("/students");
  await page
    .getByRole("row")
    .filter({ has: page.getByText(initials, { exact: true }) })
    .getByRole("button", { name: "View student" })
    .click();
  await expect(page).toHaveURL(/\/students\/[^/]+$/);
  return new URL(page.url()).pathname.slice("/students/".length);
}

test.beforeAll(async ({ browser, baseURL }) => {
  // Resolve generated seed IDs through the public UI, without DB access or saved manifests.
  const page = await browser.newPage({ baseURL });
  try {
    await signIn(page, "admin");
    students = {
      mia: await studentId(page, "MC"),
      ava: await studentId(page, "AP"),
      noah: await studentId(page, "NR"),
    };
  } finally {
    await page.close();
  }
});

async function apiSignIn(request: APIRequestContext, role: Role, origin: string) {
  const response = await request.post("/api/auth/sign-in/email", {
    data: ROLE_CREDS[role],
    headers: { Origin: origin },
  });
  expect(response.status()).toBe(HTTP_OK);
}

for (const role of roles) {
  test(`${role}: sign-in reaches role home after hydration`, async ({ page }) => {
    await signIn(page, role);
    await page.reload();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toHaveCount(0);
  });

  test(`${role}: document download and upload authorization`, async ({ request, baseURL }) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required");
    }
    await apiSignIn(request, role, new URL(baseURL).origin);
    const denied = role === "stranger" || role === "pending";
    const expected = denied ? HTTP_FORBIDDEN : HTTP_OK;
    const download = await request.get(
      `/api/files/documents/student/${students.mia}/audiogram/seed-audiogram.pdf`,
    );
    expect(download.status()).toBe(expected);
    if (!denied) {
      expect(download.headers()["cache-control"]).toBe("private, no-store");
      expect(download.headers()["content-type"]).toContain("application/pdf");
    }

    const key = `documents/student/${students.mia}/other/probe-${randomUUID()}.txt`;
    const upload = await request.post(`/api/files/upload?key=${encodeURIComponent(key)}`, {
      multipart: {
        file: {
          name: "probe.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("isolated regression probe"),
        },
      },
    });
    expect(upload.status()).toBe(expected);
    if (!denied) {
      const result = await upload.json();
      expect(result.file_url).toBe(`/api/files/${key}`);
      const stored = await request.get(result.file_url);
      expect(stored.status()).toBe(HTTP_OK);
      expect(stored.headers()["cache-control"]).toBe("private, no-store");
      expect(await stored.text()).toBe("isolated regression probe");
    }

    if (role === "teacher" || role === "parent") {
      const outside = role === "teacher" ? students.noah : students.ava;
      const forbiddenKey = `documents/student/${outside}/other/probe.txt`;
      const forbidden = await request.post(
        `/api/files/upload?key=${encodeURIComponent(forbiddenKey)}`,
        {
          multipart: {
            file: { name: "probe.txt", mimeType: "text/plain", buffer: Buffer.from("denied") },
          },
        },
      );
      expect(forbidden.status()).toBe(HTTP_FORBIDDEN);
      expect((await request.get(`/api/files/${forbiddenKey}`)).status()).toBe(HTTP_FORBIDDEN);
    }
  });
}

test("administrator: list initials, authorized detail PII", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/students");
  await expect(page.getByText("MC", { exact: true }).first()).toBeVisible();
  for (const fullName of ["Mia Chen", "Leo Nguyen", "Ava Park", "Noah Reyes"]) {
    await expect(page.getByText(fullName, { exact: true })).toHaveCount(0);
  }
  await page.goto(`/students/${students.mia}`);
  await expect(page.getByText("Mia Chen", { exact: true }).first()).toBeVisible();
});

test("teacher: assigned detail allowed, unassigned detail denied", async ({ page }) => {
  await signIn(page, "teacher");
  await page.goto(`/teachers/students/${students.mia}`);
  await expect(page.getByRole("heading", { name: "MC", exact: true })).toBeVisible();
  await page.goto(`/teachers/students/${students.noah}`);
  await expect(page.getByText(DENIED, { exact: true })).toBeVisible();
  await expect(page.getByText("Noah Reyes", { exact: true })).toHaveCount(0);
});

test("parent: linked list/detail allowed, unlinked detail denied", async ({ page }) => {
  await signIn(page, "parent");
  await expect(page.getByText("MC", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("LN", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("AP", { exact: true })).toHaveCount(0);
  await expect(page.getByText("NR", { exact: true })).toHaveCount(0);
  await page.goto(`/parents/children/${students.mia}`);
  await expect(page.getByText("Mia Chen", { exact: true }).first()).toBeVisible();
  await page.goto(`/students/${students.ava}`);
  await expect(page.getByText(DENIED, { exact: true })).toBeVisible();
  await expect(page.getByText("Ava Park", { exact: true })).toHaveCount(0);
});

test("unlinked parent: empty list and direct detail denied", async ({ page }) => {
  await signIn(page, "stranger");
  await expect(page.getByText(/No children are linked to your account yet/)).toBeVisible();
  await page.goto(`/students/${students.mia}`);
  await expect(page.getByText(DENIED, { exact: true })).toBeVisible();
  await expect(page.getByText("Mia Chen", { exact: true })).toHaveCount(0);
});

test("administrator: student edit persists after reload and restores", async ({ page }) => {
  await signIn(page, "admin");
  const edit = `/students/${students.mia}/edit`;
  await page.goto(edit);
  const school = page.getByLabel("Current School", { exact: true });
  await expect(school).toHaveValue("Lincoln Elementary");
  try {
    await school.fill("Isolated regression school");
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/students/${students.mia}$`));
    await page.goto(edit);
    await page.reload();
    await expect(school).toHaveValue("Isolated regression school");
  } finally {
    await page.goto(edit);
    await expect(school).toBeVisible();
    await school.fill("Lincoln Elementary");
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/students/${students.mia}$`));
  }
});

test("private implementation folders are not routes", async ({ page }) => {
  await signIn(page, "admin");
  for (const path of ["/_platform", "/_jobs/cron", "/_shared", "/_domain", "/_birthdays"]) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(HTTP_NOT_FOUND);
  }
});
