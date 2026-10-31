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

// Seeded photos (scripts/seed.ts) and the roles the gallery shows each one to.
// Every other role gets 403, including `pending` (unassigned users never get files).
const PHOTO_VIEWERS = {
  "center-group": ["admin", "teacher", "parent"],
  "center-mia": ["admin", "teacher", "parent"],
  "center-owen": ["admin", "teacher"],
  "popup-ava": ["admin", "teacher"],
  "remote-group": ["admin"],
} as const satisfies Record<string, readonly Role[]>;
type PhotoName = keyof typeof PHOTO_VIEWERS;
const photoNames = Object.keys(PHOTO_VIEWERS) as PhotoName[];
let photoUrls: Record<PhotoName, string>;

// Seeded bulletins (scripts/seed.ts): attachments are downloadable by exactly the
// roles the board lists the bulletin for. `pending` never reaches files or the board.
const BULLETINS = {
  "global-approved": {
    title: "Seed bulletin: welcome back",
    viewers: ["admin", "teacher", "parent", "stranger"],
  },
  "global-pending": { title: "Seed bulletin: awaiting approval", viewers: ["admin"] },
  "remote-approved": { title: "Seed bulletin: Rosewood update", viewers: ["admin"] },
} as const satisfies Record<string, { title: string; viewers: readonly Role[] }>;
const bulletins = Object.entries(BULLETINS).map(([name, { title, viewers }]) => ({
  title,
  url: `/api/files/bulletins/attachments/seed-${name}.txt`,
  viewers: viewers as readonly Role[],
}));

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

async function seededPhotoUrls(page: Page): Promise<Record<PhotoName, string>> {
  await page.goto("/admin/photo-gallery");
  const urls = {} as Record<PhotoName, string>;
  for (const name of photoNames) {
    const src = await page.getByRole("img", { name: `Seed photo: ${name}` }).getAttribute("src");
    if (!src) {
      throw new Error(`Seed photo ${name} has no src; reseed with pnpm db:seed`);
    }
    urls[name] = src;
  }
  return urls;
}

/** Location ID from a `/api/files/photos/location/<locationId>/…` URL. */
function photoLocationId(url: string): string {
  const locationId = url.split("/")[5];
  if (!locationId) {
    throw new Error(`Unexpected photo URL: ${url}`);
  }
  return locationId;
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
    photoUrls = await seededPhotoUrls(page);
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

  test(`${role}: photo download and upload authorization`, async ({ request, baseURL }) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required");
    }
    await apiSignIn(request, role, new URL(baseURL).origin);

    for (const name of photoNames) {
      const viewers: readonly Role[] = PHOTO_VIEWERS[name];
      const allowed = viewers.includes(role);
      const download = await request.get(photoUrls[name]);
      expect(download.status(), `${role} downloading ${name}`).toBe(
        allowed ? HTTP_OK : HTTP_FORBIDDEN,
      );
      if (allowed) {
        expect(download.headers()["cache-control"]).toBe("private, no-store");
      }
    }

    if (role === "teacher") {
      // Teachers may upload only to their assigned locations (center yes, Rosewood no).
      const upload = (locationId: string) =>
        request.post(
          `/api/files/upload?key=${encodeURIComponent(
            `photos/location/${locationId}/2026-01-01/probe-${randomUUID()}.png`,
          )}`,
          {
            multipart: {
              file: { name: "probe.png", mimeType: "image/png", buffer: Buffer.from("probe") },
            },
          },
        );
      expect((await upload(photoLocationId(photoUrls["center-group"]))).status()).toBe(HTTP_OK);
      expect((await upload(photoLocationId(photoUrls["remote-group"]))).status()).toBe(
        HTTP_FORBIDDEN,
      );
    }
  });

  test(`${role}: bulletin attachment downloads match the board`, async ({
    page,
    request,
    baseURL,
  }) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required");
    }
    await apiSignIn(request, role, new URL(baseURL).origin);

    for (const { title, url, viewers } of bulletins) {
      const download = await request.get(url);
      expect(download.status(), `${role} downloading "${title}"`).toBe(
        viewers.includes(role) ? HTTP_OK : HTTP_FORBIDDEN,
      );
    }

    if (role === "pending") {
      return;
    }
    await signIn(page, role);
    await page.goto("/bulletin");
    // Every board-reaching role sees the approved global bulletin; wait for it before
    // asserting absences so the list has loaded.
    await expect(page.getByText(BULLETINS["global-approved"].title, { exact: true })).toBeVisible();
    for (const { title, viewers } of bulletins) {
      await expect(page.getByText(title, { exact: true }), `${role} board`).toHaveCount(
        viewers.includes(role) ? 1 : 0,
      );
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
