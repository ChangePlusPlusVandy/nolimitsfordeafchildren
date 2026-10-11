import assert from "node:assert/strict";
import test from "node:test";

import { buildInitialQueryParams } from "./searchParams";

test("student list defaults to active students sorted by initials", () => {
  assert.deepEqual(buildInitialQueryParams({}), {
    page: 1,
    limit: 20,
    sort: "initials",
    order: "asc",
    is_active: true,
  });
});

test("student list keeps the first repeated URL parameter", () => {
  assert.deepEqual(
    buildInitialQueryParams({
      page: ["2", "3"],
      limit: "50",
      sort: "dob",
      order: "desc",
      search: ["A", "B"],
      site_id: "site-1",
      active: "all",
    }),
    {
      page: 2,
      limit: 50,
      sort: "dob",
      order: "desc",
      search: "A",
      site_id: "site-1",
    },
  );
});

test("inactive and empty filters retain their existing URL semantics", () => {
  assert.equal(buildInitialQueryParams({ active: "inactive" }).is_active, false);
  assert.equal(buildInitialQueryParams({ active: "" }).is_active, true);
  assert.equal("search" in buildInitialQueryParams({ search: "" }), false);
  assert.equal(Number.isNaN(buildInitialQueryParams({ page: "invalid" }).page), true);
});
