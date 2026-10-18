import assert from "node:assert/strict";
import { test } from "node:test";

import { extractKeyFromUrl } from "./r2.js";

/**
 * Object-key extraction (src/lib/r2.ts).
 * `extractKeyFromUrl` only parses a stored URL. It does not touch the bucket.
 */

test("app file route returns the object key", () => {
  assert.equal(extractKeyFromUrl("/api/files/photos/location/x/y.png"), "photos/location/x/y.png");
});

test("query string and hash are stripped from an app file route", () => {
  assert.equal(
    extractKeyFromUrl("/api/files/photos/location/x/y.png?download=1"),
    "photos/location/x/y.png",
  );
  assert.equal(
    extractKeyFromUrl("/api/files/photos/location/x/y.png#preview"),
    "photos/location/x/y.png",
  );
});

test("legacy r2.dev urls return the object key", () => {
  assert.equal(
    extractKeyFromUrl("https://nolimits-r2-staging.r2.dev/photos/a.png"),
    "photos/a.png",
  );
  assert.equal(
    extractKeyFromUrl("https://pub-nolimits-r2-staging.r2.dev/photos/a.png"),
    "photos/a.png",
  );
});

test("absolute app urls and unrelated strings return null", () => {
  assert.equal(extractKeyFromUrl("https://example.com/api/files/photos/location/x/y.png"), null);
  assert.equal(extractKeyFromUrl("photos/a.png"), null);
});
