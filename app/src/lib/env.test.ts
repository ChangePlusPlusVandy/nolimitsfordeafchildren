import assert from "node:assert/strict";
import { test } from "node:test";

import { getBinding, getEnvValue, getWorkerEnv } from "./env.js";

/**
 * Worker env abstraction (src/lib/env.ts).
 * Outside workerd (seed scripts, unit tests) the worker env is absent:
 * accessors must not throw and must fall back to `process.env`.
 */

test("worker env reads as an object outside workerd", () => {
  assert.equal(typeof getWorkerEnv(), "object");
});

test("string config falls back to process.env", () => {
  process.env.VINEXT_TEST_KEY = "from-process";
  try {
    assert.equal(getEnvValue("VINEXT_TEST_KEY"), "from-process");
  } finally {
    delete process.env.VINEXT_TEST_KEY;
  }
});

test("missing string config resolves undefined", () => {
  assert.equal(getEnvValue("VINEXT_TEST_KEY_MISSING"), undefined);
});

test("bindings resolve undefined outside workerd", () => {
  assert.equal(getBinding("DB"), undefined);
  assert.equal(getBinding("BUCKET"), undefined);
  assert.equal(getBinding("EMAIL"), undefined);
});
