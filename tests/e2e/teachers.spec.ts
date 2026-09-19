import { test } from "@playwright/test";

/**
 * Teachers.
 * Pages: /teachers, /teachers/new, /teachers/[id],
 *        /teachers/[id]/edit, /teachers/[id]/schedules/new,
 *        /teachers/makeup-sessions, /teachers/schedule-change-requests,
 *        /teachers/students/[id]
 * TODO: seed teachers + schedules.
 */
test.describe("teachers", () => {
  test.skip("list shows teachers", async () => {
    // TODO: admin → /teachers → expect rows.
  });

  test.skip("new creates a teacher (admin)", async () => {
    // TODO: admin → /teachers/new → fill → submit → expect redirect.
  });

  test.skip("detail shows teacher profile", async () => {
    // TODO: /teachers/:id → expect assignments.
  });

  test.skip("edit updates a teacher (admin)", async () => {
    // TODO: admin → /teachers/:id/edit → save.
  });

  test.skip("new schedule assigns teacher (admin only)", async () => {
    // TODO: admin → /teachers/:id/schedules/new → create 3x/week slot.
  });

  test.skip("makeup sessions list for teacher", async () => {
    // TODO: teacher → /teachers/makeup-sessions → expect hosted make-ups.
  });

  test.skip("schedule-change requests for teacher", async () => {
    // TODO: teacher → /teachers/schedule-change-requests → expect list.
  });

  test.skip("teacher student detail (assigned only)", async () => {
    // TODO: teacher → /teachers/students/:id → expect pre/post scores.
  });
});
