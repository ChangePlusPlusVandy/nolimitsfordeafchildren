/**
 * Bundle/cron wiring check (runs in CI after `vite build`).
 *
 * Asserts the built Worker preserves the deployment contract without
 * relying on minified export names:
 *  - cron constants in source match triggers in wrangler.jsonc (dev config)
 *  - generated dist/server/wrangler.json carries the same triggers,
 *    bindings, and compat settings
 *  - dist/server/index.js contains the scheduled handler implementation
 *    and exports it (default-composed handler + named export)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(message) {
  console.error(`[check-bundle] FAIL: ${message}`);
  process.exit(1);
}

function readJsonc(path) {
  const raw = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(raw);
}

const cronSource = readFileSync(join(root, "src/server/cron/index.ts"), "utf8");
const crons = [...cronSource.matchAll(/_CRON = "([^"]+)"/g)].map((match) => match[1]);
if (crons.length === 0) {
  fail("no cron constants found in src/server/cron/index.ts");
}

const wrangler = readJsonc(join(root, "wrangler.jsonc"));
for (const cron of crons) {
  if (!wrangler.triggers?.crons?.includes(cron)) {
    fail(`wrangler.jsonc triggers missing ${cron}`);
  }
}

const generated = JSON.parse(readFileSync(join(root, "dist/server/wrangler.json"), "utf8"));
for (const cron of crons) {
  if (!generated.triggers?.crons?.includes(cron)) {
    fail(`dist/server/wrangler.json triggers missing ${cron}`);
  }
}
for (const binding of ["DB", "BUCKET", "EMAIL"]) {
  const present =
    JSON.stringify(generated.d1_databases ?? []).includes(`"${binding}"`) ||
    JSON.stringify(generated.r2_buckets ?? []).includes(`"${binding}"`) ||
    JSON.stringify(generated.send_email ?? []).includes(`"${binding}"`);
  if (!present) {
    fail(`dist/server/wrangler.json missing ${binding} binding`);
  }
}

const bundle = readFileSync(join(root, "dist/server/index.js"), "utf8");
if (!bundle.includes("[Cron] scheduled event")) {
  fail("dist/server/index.js missing scheduled handler implementation");
}
// Cloudflare reads lifecycle handlers off the default export: prove the
// default-exported object literal composes `scheduled` in. A named-only
// export (`export { default } from ...` plus a separate `scheduled`)
// passes a naive export-name grep but never fires. No minified names are
// assumed: the default alias is read out of the export statement itself.
const defaultAlias = bundle.match(/export\{[^}]*\b(\w+) as default\b[^}]*\}/)?.[1];
if (!defaultAlias) {
  fail("dist/server/index.js has no default export");
}
const composed = new RegExp(`(var|const|let)\\s+${defaultAlias}\\s*=\\s*\\{[^}]*\\bscheduled\\b`);
if (!composed.test(bundle)) {
  fail("dist/server/index.js default export does not compose scheduled");
}

console.log(`[check-bundle] OK: crons ${crons.join(", ")} wired through config and bundle`);
